// Procedural terrain generation: heightmap, water, and trees.

import { Block } from './blocks';
import { hash2, ValueNoise2D } from './noise';

export const CHUNK_SIZE = 16;
export const WORLD_HEIGHT = 80;
export const SEA_LEVEL = 30;

const SEED = 1337;
const continentNoise = new ValueNoise2D(SEED);
const detailNoise = new ValueNoise2D(SEED ^ 0xabcdef);

export function terrainHeight(x: number, z: number): number {
  const base = continentNoise.fbm(x / 140, z / 140, 4) ** 1.25 * 40;
  const detail = (detailNoise.fbm(x / 28, z / 28, 2) - 0.5) * 7;
  const h = Math.floor(16 + base + detail);
  return Math.max(2, Math.min(WORLD_HEIGHT - 12, h));
}

export function blockIndex(x: number, y: number, z: number): number {
  return (y * CHUNK_SIZE + z) * CHUNK_SIZE + x;
}

interface TreeSpot {
  x: number;
  z: number;
  surface: number;
  trunk: number;
}

function treeAt(x: number, z: number): TreeSpot | null {
  if (hash2(x, z, SEED ^ 0x7ee5) >= 0.014) return null;
  const surface = terrainHeight(x, z);
  if (surface <= SEA_LEVEL + 1) return null;
  const trunk = 4 + Math.floor(hash2(x, z, SEED ^ 0x1234) * 3);
  return { x, z, surface, trunk };
}

/** Generates the raw block data for a chunk at chunk coords (cx, cz). */
export function generateChunkData(cx: number, cz: number): Uint8Array {
  const data = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * WORLD_HEIGHT);
  const ox = cx * CHUNK_SIZE;
  const oz = cz * CHUNK_SIZE;

  for (let lz = 0; lz < CHUNK_SIZE; lz++) {
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      const wx = ox + lx;
      const wz = oz + lz;
      const h = terrainHeight(wx, wz);
      const beach = h <= SEA_LEVEL + 1;
      for (let y = 0; y <= h; y++) {
        let id: number;
        if (y === 0) id = Block.Bedrock;
        else if (y < h - 3) id = Block.Stone;
        else if (y < h) id = beach ? Block.Sand : Block.Dirt;
        else id = beach ? Block.Sand : Block.Grass;
        data[blockIndex(lx, y, lz)] = id;
      }
      for (let y = h + 1; y <= SEA_LEVEL; y++) {
        data[blockIndex(lx, y, lz)] = Block.Water;
      }
    }
  }

  // Trees, including ones whose canopy reaches in from neighbouring chunks.
  const R = 2;
  for (let z = oz - R; z < oz + CHUNK_SIZE + R; z++) {
    for (let x = ox - R; x < ox + CHUNK_SIZE + R; x++) {
      const tree = treeAt(x, z);
      if (!tree) continue;
      stampTree(data, ox, oz, tree);
    }
  }

  return data;
}

function setLocal(data: Uint8Array, lx: number, y: number, lz: number, id: number, keepSolid = false): void {
  if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE || y < 0 || y >= WORLD_HEIGHT) return;
  const idx = blockIndex(lx, y, lz);
  if (keepSolid && data[idx] !== Block.Air && data[idx] !== Block.Leaves) return;
  data[idx] = id;
}

function stampTree(data: Uint8Array, ox: number, oz: number, tree: TreeSpot): void {
  const lx = tree.x - ox;
  const lz = tree.z - oz;
  const top = tree.surface + tree.trunk;

  // Canopy: two wide layers below the top, narrower cap above.
  for (let dy = -2; dy <= 1; dy++) {
    const y = top + dy;
    const radius = dy <= -1 ? 2 : 1;
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dz === 0 && dy <= 0) continue; // trunk goes here
        const corner = Math.abs(dx) === radius && Math.abs(dz) === radius;
        if (corner && hash2(tree.x * 31 + dx, tree.z * 31 + dz + dy * 7, 0x5eed) < 0.5) continue;
        setLocal(data, lx + dx, y, lz + dz, Block.Leaves, true);
      }
    }
  }

  for (let y = tree.surface + 1; y <= top; y++) {
    setLocal(data, lx, y, lz, Block.Log);
  }
}
