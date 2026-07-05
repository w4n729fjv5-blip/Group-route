// Voxel raycast (Amanatides & Woo DDA) for picking the targeted block.

import * as THREE from 'three';
import { Block, isSolid } from './blocks';
import { World } from './world';

export interface RayHit {
  /** The solid block that was hit. */
  block: THREE.Vector3;
  /** The empty cell adjacent to the hit face (where a new block goes). */
  adjacent: THREE.Vector3;
  id: number;
}

export function raycastBlocks(
  world: World,
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  maxDistance: number,
): RayHit | null {
  let x = Math.floor(origin.x);
  let y = Math.floor(origin.y);
  let z = Math.floor(origin.z);

  const stepX = Math.sign(direction.x);
  const stepY = Math.sign(direction.y);
  const stepZ = Math.sign(direction.z);

  const tDeltaX = stepX !== 0 ? Math.abs(1 / direction.x) : Infinity;
  const tDeltaY = stepY !== 0 ? Math.abs(1 / direction.y) : Infinity;
  const tDeltaZ = stepZ !== 0 ? Math.abs(1 / direction.z) : Infinity;

  const bound = (p: number, cell: number, step: number, tDelta: number) =>
    step > 0 ? (cell + 1 - p) * tDelta : step < 0 ? (p - cell) * tDelta : Infinity;

  let tMaxX = bound(origin.x, x, stepX, tDeltaX);
  let tMaxY = bound(origin.y, y, stepY, tDeltaY);
  let tMaxZ = bound(origin.z, z, stepZ, tDeltaZ);

  let px = x;
  let py = y;
  let pz = z;
  let t = 0;

  while (t <= maxDistance) {
    const id = world.getBlock(x, y, z);
    if (id !== Block.Air && id !== Block.Water && isSolid(id)) {
      return {
        block: new THREE.Vector3(x, y, z),
        adjacent: new THREE.Vector3(px, py, pz),
        id,
      };
    }
    px = x;
    py = y;
    pz = z;
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      t = tMaxX;
      tMaxX += tDeltaX;
      x += stepX;
    } else if (tMaxY < tMaxZ) {
      t = tMaxY;
      tMaxY += tDeltaY;
      y += stepY;
    } else {
      t = tMaxZ;
      tMaxZ += tDeltaZ;
      z += stepZ;
    }
  }
  return null;
}
