// First-person player: movement, gravity, and voxel AABB collision.

import * as THREE from 'three';
import { Block } from './blocks';
import { World } from './world';
import { SEA_LEVEL, terrainHeight, WORLD_HEIGHT } from './terrain';

const WIDTH = 0.6;
const HEIGHT = 1.8;
export const EYE_HEIGHT = 1.62;

const WALK_SPEED = 4.3;
const SPRINT_SPEED = 7.0;
const FLY_SPEED = 12.0;
const JUMP_VELOCITY = 8.2;
const GRAVITY = 24.0;
const SWIM_SPEED = 4.5;
const SINK_SPEED = 3.0;

export interface InputState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  down: boolean;
  sprint: boolean;
}

export class Player {
  position = new THREE.Vector3();
  velocity = new THREE.Vector3();
  yaw = 0;
  pitch = 0;
  onGround = false;
  flying = false;

  constructor(private world: World) {
    const sx = 8.5;
    const sz = 8.5;
    const h = Math.max(terrainHeight(Math.floor(sx), Math.floor(sz)), SEA_LEVEL);
    this.position.set(sx, h + 3, sz);
  }

  get eyePosition(): THREE.Vector3 {
    return new THREE.Vector3(this.position.x, this.position.y + EYE_HEIGHT, this.position.z);
  }

  lookDirection(): THREE.Vector3 {
    const cp = Math.cos(this.pitch);
    return new THREE.Vector3(-Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp);
  }

  update(dt: number, input: InputState): void {
    dt = Math.min(dt, 0.05);

    // Desired horizontal movement in world space from yaw.
    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    let mx = 0;
    let mz = 0;
    if (input.forward) { mx -= sin; mz -= cos; }
    if (input.back) { mx += sin; mz += cos; }
    if (input.left) { mx -= cos; mz += sin; }
    if (input.right) { mx += cos; mz -= sin; }
    const len = Math.hypot(mx, mz);
    if (len > 0) { mx /= len; mz /= len; }

    const speed = this.flying ? FLY_SPEED : input.sprint ? SPRINT_SPEED : WALK_SPEED;
    this.velocity.x = mx * speed;
    this.velocity.z = mz * speed;

    const inWater =
      this.world.getBlock(
        Math.floor(this.position.x),
        Math.floor(this.position.y + 0.5),
        Math.floor(this.position.z),
      ) === Block.Water;

    if (this.flying) {
      this.velocity.y = 0;
      if (input.jump) this.velocity.y = FLY_SPEED;
      if (input.down) this.velocity.y = -FLY_SPEED;
    } else if (inWater) {
      // Buoyant swimming: gentle sink, hold jump to swim up.
      this.velocity.y -= GRAVITY * 0.35 * dt;
      if (input.jump) this.velocity.y = SWIM_SPEED;
      this.velocity.y = Math.max(this.velocity.y, -SINK_SPEED);
      this.velocity.x *= 0.7;
      this.velocity.z *= 0.7;
    } else {
      this.velocity.y -= GRAVITY * dt;
      if (input.jump && this.onGround) {
        this.velocity.y = JUMP_VELOCITY;
        this.onGround = false;
      }
    }

    this.moveAxis(this.velocity.x * dt, 0, 0);
    this.moveAxis(0, this.velocity.y * dt, 0);
    this.moveAxis(0, 0, this.velocity.z * dt);

    // Safety net: falling out of the world respawns at the surface.
    if (this.position.y < -10) {
      const h = terrainHeight(Math.floor(this.position.x), Math.floor(this.position.z));
      this.position.y = Math.max(h, SEA_LEVEL) + 3;
      this.velocity.set(0, 0, 0);
    }
  }

  private collides(): boolean {
    const half = WIDTH / 2;
    const minX = Math.floor(this.position.x - half);
    const maxX = Math.floor(this.position.x + half);
    const minY = Math.floor(this.position.y);
    const maxY = Math.floor(this.position.y + HEIGHT);
    const minZ = Math.floor(this.position.z - half);
    const maxZ = Math.floor(this.position.z + half);
    for (let y = Math.max(0, minY); y <= Math.min(WORLD_HEIGHT - 1, maxY); y++) {
      for (let z = minZ; z <= maxZ; z++) {
        for (let x = minX; x <= maxX; x++) {
          if (this.world.isSolidAt(x, y, z)) return true;
        }
      }
    }
    return false;
  }

  private moveAxis(dx: number, dy: number, dz: number): void {
    this.position.x += dx;
    this.position.y += dy;
    this.position.z += dz;
    if (!this.collides()) {
      if (dy !== 0) this.onGround = false;
      return;
    }

    if (dy < 0) {
      // Landed: snap on top of the block below.
      this.position.y = Math.floor(this.position.y) + 1 + 1e-4;
      // Step up out of any remaining overlap (should not normally loop).
      let guard = 0;
      while (this.collides() && guard++ < 4) this.position.y += 1;
      this.velocity.y = 0;
      this.onGround = true;
    } else if (dy > 0) {
      this.position.y -= dy;
      this.velocity.y = 0;
    } else {
      this.position.x -= dx;
      this.position.z -= dz;
    }
  }

  /** True if placing a block at these voxel coords would overlap the player. */
  intersectsBlock(bx: number, by: number, bz: number): boolean {
    const half = WIDTH / 2;
    return (
      bx + 1 > this.position.x - half &&
      bx < this.position.x + half &&
      by + 1 > this.position.y &&
      by < this.position.y + HEIGHT &&
      bz + 1 > this.position.z - half &&
      bz < this.position.z + half
    );
  }
}
