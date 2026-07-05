// Chunk storage, lazy generation around the player, and chunk meshing.

import * as THREE from 'three';
import { Block, BLOCKS, getAtlasTexture, isSolid, isTransparent, tileUV } from './blocks';
import { blockIndex, CHUNK_SIZE, generateChunkData, WORLD_HEIGHT } from './terrain';

export const RENDER_DISTANCE = 4;

interface Chunk {
  cx: number;
  cz: number;
  data: Uint8Array;
  opaqueMesh: THREE.Mesh | null;
  waterMesh: THREE.Mesh | null;
  meshed: boolean;
  dirty: boolean;
}

// Faces: direction, the 4 corners (CCW seen from outside), and baked brightness.
interface FaceSpec {
  dir: [number, number, number];
  corners: [number, number, number][];
  shade: number;
}

const FACES: FaceSpec[] = [
  { dir: [0, 1, 0], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], shade: 1.0 }, // top
  { dir: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], shade: 0.5 }, // bottom
  { dir: [1, 0, 0], corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], shade: 0.75 }, // +x
  { dir: [-1, 0, 0], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], shade: 0.75 }, // -x
  { dir: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], shade: 0.85 }, // +z
  { dir: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], shade: 0.85 }, // -z
];

export class World {
  private chunks = new Map<string, Chunk>();
  private opaqueMaterial: THREE.Material;
  private waterMaterial: THREE.Material;

  constructor(private scene: THREE.Scene) {
    const atlas = getAtlasTexture();
    this.opaqueMaterial = new THREE.MeshBasicMaterial({
      map: atlas,
      vertexColors: true,
      fog: true,
      alphaTest: 0.15,
    });
    this.waterMaterial = new THREE.MeshBasicMaterial({
      map: atlas,
      vertexColors: true,
      fog: true,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  private key(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  private ensureData(cx: number, cz: number): Chunk {
    const k = this.key(cx, cz);
    let chunk = this.chunks.get(k);
    if (!chunk) {
      chunk = {
        cx,
        cz,
        data: generateChunkData(cx, cz),
        opaqueMesh: null,
        waterMesh: null,
        meshed: false,
        dirty: false,
      };
      this.chunks.set(k, chunk);
    }
    return chunk;
  }

  getBlock(x: number, y: number, z: number): number {
    if (y < 0 || y >= WORLD_HEIGHT) return Block.Air;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const chunk = this.chunks.get(this.key(cx, cz));
    if (!chunk) return Block.Air;
    return chunk.data[blockIndex(x - cx * CHUNK_SIZE, y, z - cz * CHUNK_SIZE)];
  }

  isSolidAt(x: number, y: number, z: number): boolean {
    return isSolid(this.getBlock(x, y, z));
  }

  setBlock(x: number, y: number, z: number, id: number): void {
    if (y < 0 || y >= WORLD_HEIGHT) return;
    const cx = Math.floor(x / CHUNK_SIZE);
    const cz = Math.floor(z / CHUNK_SIZE);
    const chunk = this.chunks.get(this.key(cx, cz));
    if (!chunk) return;
    const lx = x - cx * CHUNK_SIZE;
    const lz = z - cz * CHUNK_SIZE;
    chunk.data[blockIndex(lx, y, lz)] = id;
    chunk.dirty = true;
    // Border edits also affect the neighbouring chunk's mesh.
    if (lx === 0) this.markDirty(cx - 1, cz);
    if (lx === CHUNK_SIZE - 1) this.markDirty(cx + 1, cz);
    if (lz === 0) this.markDirty(cx, cz - 1);
    if (lz === CHUNK_SIZE - 1) this.markDirty(cx, cz + 1);
  }

  private markDirty(cx: number, cz: number): void {
    const chunk = this.chunks.get(this.key(cx, cz));
    if (chunk && chunk.meshed) chunk.dirty = true;
  }

  /** Called every frame: loads/meshes chunks near the player, unloads far ones. */
  update(playerX: number, playerZ: number): void {
    const pcx = Math.floor(playerX / CHUNK_SIZE);
    const pcz = Math.floor(playerZ / CHUNK_SIZE);

    // Rebuild edited chunks immediately so block edits feel instant.
    for (const chunk of this.chunks.values()) {
      if (chunk.dirty && chunk.meshed) this.buildMesh(chunk);
    }

    // Mesh new chunks nearest-first, a couple per frame.
    let budget = 2;
    outer: for (let r = 0; r <= RENDER_DISTANCE && budget > 0; r++) {
      for (let dz = -r; dz <= r && budget > 0; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const cx = pcx + dx;
          const cz = pcz + dz;
          const chunk = this.ensureData(cx, cz);
          if (!chunk.meshed) {
            // Neighbour data must exist so border faces cull correctly.
            for (let nz = -1; nz <= 1; nz++) {
              for (let nx = -1; nx <= 1; nx++) this.ensureData(cx + nx, cz + nz);
            }
            this.buildMesh(chunk);
            if (--budget <= 0) break outer;
          }
        }
      }
    }

    // Unload chunks well outside the render distance.
    for (const [k, chunk] of this.chunks) {
      const dist = Math.max(Math.abs(chunk.cx - pcx), Math.abs(chunk.cz - pcz));
      if (dist > RENDER_DISTANCE + 2) {
        this.disposeMeshes(chunk);
        this.chunks.delete(k);
      }
    }
  }

  private disposeMeshes(chunk: Chunk): void {
    for (const mesh of [chunk.opaqueMesh, chunk.waterMesh]) {
      if (mesh) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
      }
    }
    chunk.opaqueMesh = null;
    chunk.waterMesh = null;
    chunk.meshed = false;
  }

  private buildMesh(chunk: Chunk): void {
    this.disposeMeshes(chunk);

    const opaque = new GeometryBuilder();
    const water = new GeometryBuilder();
    const ox = chunk.cx * CHUNK_SIZE;
    const oz = chunk.cz * CHUNK_SIZE;

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
          const id = chunk.data[blockIndex(lx, y, lz)];
          if (id === Block.Air) continue;
          const def = BLOCKS[id];
          if (!def) continue;
          const wx = ox + lx;
          const wz = oz + lz;
          const builder = id === Block.Water || id === Block.Glass ? water : opaque;

          for (const face of FACES) {
            const nx = wx + face.dir[0];
            const ny = y + face.dir[1];
            const nz = wz + face.dir[2];
            const neighbor = ny >= WORLD_HEIGHT ? Block.Air : ny < 0 ? Block.Bedrock : this.getBlock(nx, ny, nz);
            if (neighbor === id) continue;
            if (!isTransparent(neighbor)) continue;
            const tile = face.dir[1] > 0 ? def.tiles[0] : face.dir[1] < 0 ? def.tiles[1] : def.tiles[2];
            builder.addFace(wx, y, wz, face, tile);
          }
        }
      }
    }

    chunk.opaqueMesh = opaque.toMesh(this.opaqueMaterial);
    chunk.waterMesh = water.toMesh(this.waterMaterial);
    for (const mesh of [chunk.opaqueMesh, chunk.waterMesh]) {
      if (mesh) this.scene.add(mesh);
    }
    chunk.meshed = true;
    chunk.dirty = false;
  }
}

class GeometryBuilder {
  private positions: number[] = [];
  private colors: number[] = [];
  private uvs: number[] = [];
  private indices: number[] = [];

  addFace(x: number, y: number, z: number, face: FaceSpec, tile: number): void {
    const base = this.positions.length / 3;
    const { u0, v0, u1, v1 } = tileUV(tile);
    const uvCorners = [
      [u0, v0],
      [u1, v0],
      [u1, v1],
      [u0, v1],
    ];
    for (let i = 0; i < 4; i++) {
      const c = face.corners[i];
      this.positions.push(x + c[0], y + c[1], z + c[2]);
      this.colors.push(face.shade, face.shade, face.shade);
      this.uvs.push(uvCorners[i][0], uvCorners[i][1]);
    }
    this.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  toMesh(material: THREE.Material): THREE.Mesh | null {
    if (this.indices.length === 0) return null;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2));
    geometry.setIndex(this.indices);
    geometry.computeBoundingSphere();
    return new THREE.Mesh(geometry, material);
  }
}
