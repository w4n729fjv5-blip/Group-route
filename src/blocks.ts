// Block definitions and the procedurally generated texture atlas.

import * as THREE from 'three';
import { mulberry32 } from './noise';

export const enum Block {
  Air = 0,
  Grass = 1,
  Dirt = 2,
  Stone = 3,
  Sand = 4,
  Log = 5,
  Leaves = 6,
  Plank = 7,
  Cobble = 8,
  Glass = 9,
  Water = 10,
  Bedrock = 11,
}

// Tile indices in the atlas (4x4 grid of 16px tiles).
const enum Tile {
  GrassTop = 0,
  GrassSide = 1,
  Dirt = 2,
  Stone = 3,
  Sand = 4,
  LogSide = 5,
  LogTop = 6,
  Leaves = 7,
  Plank = 8,
  Cobble = 9,
  Glass = 10,
  Water = 11,
  Bedrock = 12,
}

export interface BlockDef {
  name: string;
  /** Atlas tile per face: [top, bottom, side]. */
  tiles: [number, number, number];
  solid: boolean;
  /** Transparent blocks let neighbouring faces render (glass, water, leaves). */
  transparent: boolean;
}

export const BLOCKS: Record<number, BlockDef> = {
  [Block.Grass]: { name: 'Grass', tiles: [Tile.GrassTop, Tile.Dirt, Tile.GrassSide], solid: true, transparent: false },
  [Block.Dirt]: { name: 'Dirt', tiles: [Tile.Dirt, Tile.Dirt, Tile.Dirt], solid: true, transparent: false },
  [Block.Stone]: { name: 'Stone', tiles: [Tile.Stone, Tile.Stone, Tile.Stone], solid: true, transparent: false },
  [Block.Sand]: { name: 'Sand', tiles: [Tile.Sand, Tile.Sand, Tile.Sand], solid: true, transparent: false },
  [Block.Log]: { name: 'Log', tiles: [Tile.LogTop, Tile.LogTop, Tile.LogSide], solid: true, transparent: false },
  [Block.Leaves]: { name: 'Leaves', tiles: [Tile.Leaves, Tile.Leaves, Tile.Leaves], solid: true, transparent: true },
  [Block.Plank]: { name: 'Plank', tiles: [Tile.Plank, Tile.Plank, Tile.Plank], solid: true, transparent: false },
  [Block.Cobble]: { name: 'Cobble', tiles: [Tile.Cobble, Tile.Cobble, Tile.Cobble], solid: true, transparent: false },
  [Block.Glass]: { name: 'Glass', tiles: [Tile.Glass, Tile.Glass, Tile.Glass], solid: true, transparent: true },
  [Block.Water]: { name: 'Water', tiles: [Tile.Water, Tile.Water, Tile.Water], solid: false, transparent: true },
  [Block.Bedrock]: { name: 'Bedrock', tiles: [Tile.Bedrock, Tile.Bedrock, Tile.Bedrock], solid: true, transparent: false },
};

/** Blocks the player can pick in the hotbar. */
export const PLACEABLE: Block[] = [
  Block.Grass,
  Block.Dirt,
  Block.Stone,
  Block.Sand,
  Block.Log,
  Block.Leaves,
  Block.Plank,
  Block.Cobble,
  Block.Glass,
];

export const ATLAS_COLS = 4;
export const ATLAS_ROWS = 4;
export const TILE_PX = 16;

type RGB = [number, number, number];

function paintTile(
  ctx: CanvasRenderingContext2D,
  tile: number,
  base: RGB,
  variation: number,
  detail?: (px: (x: number, y: number, c: RGB, a?: number) => void, rand: () => number) => void,
): void {
  const tx = (tile % ATLAS_COLS) * TILE_PX;
  const ty = Math.floor(tile / ATLAS_COLS) * TILE_PX;
  const rand = mulberry32(1234 + tile * 7919);
  const px = (x: number, y: number, c: RGB, a = 1) => {
    ctx.fillStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
    ctx.fillRect(tx + x, ty + y, 1, 1);
  };
  for (let y = 0; y < TILE_PX; y++) {
    for (let x = 0; x < TILE_PX; x++) {
      const v = 1 + (rand() - 0.5) * variation;
      px(x, y, [base[0] * v, base[1] * v, base[2] * v]);
    }
  }
  if (detail) detail(px, rand);
}

/** Builds the texture atlas canvas. Also used for hotbar slot icons. */
export function buildAtlasCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_COLS * TILE_PX;
  canvas.height = ATLAS_ROWS * TILE_PX;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  paintTile(ctx, Tile.GrassTop, [106, 170, 64], 0.18);
  paintTile(ctx, Tile.Dirt, [134, 96, 67], 0.2);
  paintTile(ctx, Tile.GrassSide, [134, 96, 67], 0.2, (px, rand) => {
    for (let x = 0; x < TILE_PX; x++) {
      const depth = 3 + Math.floor(rand() * 2);
      for (let y = 0; y < depth; y++) {
        const v = 1 + (rand() - 0.5) * 0.2;
        px(x, y, [106 * v, 170 * v, 64 * v]);
      }
    }
  });
  paintTile(ctx, Tile.Stone, [125, 125, 125], 0.12, (px, rand) => {
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(rand() * 14);
      const y = Math.floor(rand() * 14);
      px(x, y, [100, 100, 100]);
      px(x + 1, y, [100, 100, 100]);
    }
  });
  paintTile(ctx, Tile.Sand, [219, 207, 163], 0.1);
  paintTile(ctx, Tile.LogSide, [102, 81, 50], 0.12, (px, rand) => {
    for (const x of [2, 6, 10, 14]) {
      for (let y = 0; y < TILE_PX; y++) {
        if (rand() < 0.85) px(x, y, [80, 62, 38]);
      }
    }
  });
  paintTile(ctx, Tile.LogTop, [102, 81, 50], 0.08, (px) => {
    for (let r = 2; r <= 6; r += 2) {
      for (let a = 0; a < 40; a++) {
        const t = (a / 40) * Math.PI * 2;
        const x = Math.round(7.5 + Math.cos(t) * r);
        const y = Math.round(7.5 + Math.sin(t) * r);
        if (x >= 0 && x < 16 && y >= 0 && y < 16) px(x, y, [130, 106, 68]);
      }
    }
  });
  paintTile(ctx, Tile.Leaves, [58, 122, 40], 0.35, (px, rand) => {
    for (let i = 0; i < 24; i++) {
      px(Math.floor(rand() * 16), Math.floor(rand() * 16), [40, 90, 28]);
    }
  });
  paintTile(ctx, Tile.Plank, [178, 143, 90], 0.08, (px) => {
    for (const y of [3, 7, 11, 15]) {
      for (let x = 0; x < TILE_PX; x++) px(x, y, [140, 110, 66]);
    }
  });
  paintTile(ctx, Tile.Cobble, [110, 110, 110], 0.25, (px, rand) => {
    for (let i = 0; i < 8; i++) {
      const x = Math.floor(rand() * 13);
      const y = Math.floor(rand() * 13);
      for (let dx = 0; dx < 3; dx++) px(x + dx, y, [70, 70, 70]);
    }
  });
  // Glass: mostly transparent with a frame.
  {
    const tx = (Tile.Glass % ATLAS_COLS) * TILE_PX;
    const ty = Math.floor(Tile.Glass / ATLAS_COLS) * TILE_PX;
    ctx.clearRect(tx, ty, TILE_PX, TILE_PX);
    ctx.fillStyle = 'rgba(200, 225, 255, 0.25)';
    ctx.fillRect(tx, ty, TILE_PX, TILE_PX);
    ctx.fillStyle = 'rgba(230, 240, 255, 0.9)';
    ctx.fillRect(tx, ty, TILE_PX, 1);
    ctx.fillRect(tx, ty + TILE_PX - 1, TILE_PX, 1);
    ctx.fillRect(tx, ty, 1, TILE_PX);
    ctx.fillRect(tx + TILE_PX - 1, ty, 1, TILE_PX);
    ctx.fillRect(tx + 3, ty + 3, 2, 1);
    ctx.fillRect(tx + 2, ty + 4, 1, 2);
  }
  // Water: translucent blue.
  {
    const tx = (Tile.Water % ATLAS_COLS) * TILE_PX;
    const ty = Math.floor(Tile.Water / ATLAS_COLS) * TILE_PX;
    ctx.clearRect(tx, ty, TILE_PX, TILE_PX);
    const rand = mulberry32(99);
    for (let y = 0; y < TILE_PX; y++) {
      for (let x = 0; x < TILE_PX; x++) {
        const v = 1 + (rand() - 0.5) * 0.15;
        ctx.fillStyle = `rgba(${(40 * v) | 0},${(94 * v) | 0},${(190 * v) | 0},0.65)`;
        ctx.fillRect(tx + x, ty + y, 1, 1);
      }
    }
  }
  paintTile(ctx, Tile.Bedrock, [60, 60, 60], 0.4);

  return canvas;
}

let atlasTexture: THREE.CanvasTexture | null = null;
let atlasCanvas: HTMLCanvasElement | null = null;

export function getAtlasCanvas(): HTMLCanvasElement {
  if (!atlasCanvas) atlasCanvas = buildAtlasCanvas();
  return atlasCanvas;
}

export function getAtlasTexture(): THREE.CanvasTexture {
  if (!atlasTexture) {
    atlasTexture = new THREE.CanvasTexture(getAtlasCanvas());
    atlasTexture.magFilter = THREE.NearestFilter;
    atlasTexture.minFilter = THREE.NearestFilter;
    atlasTexture.colorSpace = THREE.SRGBColorSpace;
  }
  return atlasTexture;
}

/** UV rectangle for an atlas tile, inset slightly to avoid bleeding. */
export function tileUV(tile: number): { u0: number; v0: number; u1: number; v1: number } {
  const eps = 0.02 / ATLAS_COLS;
  const col = tile % ATLAS_COLS;
  const row = Math.floor(tile / ATLAS_COLS);
  const u0 = col / ATLAS_COLS + eps;
  const u1 = (col + 1) / ATLAS_COLS - eps;
  // Canvas y is top-down; UV v is bottom-up.
  const v1 = 1 - row / ATLAS_ROWS - eps;
  const v0 = 1 - (row + 1) / ATLAS_ROWS + eps;
  return { u0, v0, u1, v1 };
}

export function isSolid(id: number): boolean {
  return id !== Block.Air && BLOCKS[id] !== undefined && BLOCKS[id].solid;
}

export function isTransparent(id: number): boolean {
  return id === Block.Air || (BLOCKS[id]?.transparent ?? false);
}
