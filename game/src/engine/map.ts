import { MAP_COLS, MAP_ROWS, TILE_SIZE } from "./constants";

export const enum Tile {
  Grass = 0,
  Path = 1,
  Tree = 2,
  Water = 3,
  Rock = 4,
}

const SOLID_TILES = new Set<Tile>([Tile.Tree, Tile.Water, Tile.Rock]);

const TILE_COLORS: Record<Tile, string> = {
  [Tile.Grass]: "#3d8b3d",
  [Tile.Path]: "#c2a165",
  [Tile.Tree]: "#1f4d1f",
  [Tile.Water]: "#2b6cb0",
  [Tile.Rock]: "#6b6b6b",
};

function buildMap(): Tile[][] {
  const grid: Tile[][] = Array.from({ length: MAP_ROWS }, () =>
    Array.from({ length: MAP_COLS }, () => Tile.Grass),
  );

  // Border wall of trees.
  for (let x = 0; x < MAP_COLS; x++) {
    grid[0][x] = Tile.Tree;
    grid[MAP_ROWS - 1][x] = Tile.Tree;
  }
  for (let y = 0; y < MAP_ROWS; y++) {
    grid[y][0] = Tile.Tree;
    grid[y][MAP_COLS - 1] = Tile.Tree;
  }

  // A dirt path crossing the area.
  for (let x = 1; x < MAP_COLS - 1; x++) {
    grid[7][x] = Tile.Path;
  }
  for (let y = 1; y < MAP_ROWS - 1; y++) {
    grid[y][10] = Tile.Path;
  }

  // Pond in the top-right.
  for (let y = 2; y <= 4; y++) {
    for (let x = 14; x <= 17; x++) {
      grid[y][x] = Tile.Water;
    }
  }

  // Rock cluster in the bottom-left.
  const rocks: Array<[number, number]> = [
    [10, 3], [10, 4], [11, 3], [11, 4], [12, 4],
  ];
  for (const [y, x] of rocks) grid[y][x] = Tile.Rock;

  // Scattered trees for flavor.
  const trees: Array<[number, number]> = [
    [3, 3], [3, 13], [4, 6], [9, 15], [9, 16], [12, 12], [12, 13], [3, 16],
  ];
  for (const [y, x] of trees) grid[y][x] = Tile.Tree;

  return grid;
}

export class GameMap {
  readonly grid: Tile[][] = buildMap();

  tileAt(col: number, row: number): Tile {
    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return Tile.Tree;
    return this.grid[row][col];
  }

  isSolidPixel(px: number, py: number): boolean {
    const col = Math.floor(px / TILE_SIZE);
    const row = Math.floor(py / TILE_SIZE);
    return SOLID_TILES.has(this.tileAt(col, row));
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        ctx.fillStyle = TILE_COLORS[this.grid[row][col]];
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}
