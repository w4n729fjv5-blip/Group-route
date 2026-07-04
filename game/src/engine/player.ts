import { CANVAS_WIDTH, CANVAS_HEIGHT, Direction, PLAYER_SIZE, PLAYER_SPEED } from "./constants";
import { GameMap } from "./map";
import { Input } from "./input";

export class Player {
  x: number;
  y: number;
  direction: Direction = "down";
  moving = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  private canOccupy(map: GameMap, x: number, y: number): boolean {
    const inset = 2; // shrink hitbox slightly so corners don't snag on tile edges
    const left = x + inset;
    const right = x + PLAYER_SIZE - inset;
    const top = y + inset;
    const bottom = y + PLAYER_SIZE - inset;
    return (
      !map.isSolidPixel(left, top) &&
      !map.isSolidPixel(right, top) &&
      !map.isSolidPixel(left, bottom) &&
      !map.isSolidPixel(right, bottom)
    );
  }

  update(dt: number, input: Input, map: GameMap): void {
    let dx = 0;
    let dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;

    this.moving = dx !== 0 || dy !== 0;

    if (dx !== 0 && dy !== 0) {
      // Normalize diagonal movement so it isn't faster than cardinal movement.
      const norm = Math.SQRT1_2;
      dx *= norm;
      dy *= norm;
    }

    if (dx < 0) this.direction = "left";
    else if (dx > 0) this.direction = "right";
    else if (dy < 0) this.direction = "up";
    else if (dy > 0) this.direction = "down";

    const nextX = this.x + dx * PLAYER_SPEED * dt;
    const nextY = this.y + dy * PLAYER_SPEED * dt;

    if (this.canOccupy(map, nextX, this.y)) {
      this.x = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_SIZE, nextX));
    }
    if (this.canOccupy(map, this.x, nextY)) {
      this.y = Math.max(0, Math.min(CANVAS_HEIGHT - PLAYER_SIZE, nextY));
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Body
    ctx.fillStyle = "#2f6fed";
    ctx.fillRect(this.x, this.y, PLAYER_SIZE, PLAYER_SIZE);

    // Directional indicator (a lighter "face" nub showing which way the player faces)
    ctx.fillStyle = "#e8c07d";
    const nub = 8;
    const cx = this.x + PLAYER_SIZE / 2;
    const cy = this.y + PLAYER_SIZE / 2;
    switch (this.direction) {
      case "up":
        ctx.fillRect(cx - nub / 2, this.y, nub, nub);
        break;
      case "down":
        ctx.fillRect(cx - nub / 2, this.y + PLAYER_SIZE - nub, nub, nub);
        break;
      case "left":
        ctx.fillRect(this.x, cy - nub / 2, nub, nub);
        break;
      case "right":
        ctx.fillRect(this.x + PLAYER_SIZE - nub, cy - nub / 2, nub, nub);
        break;
    }
  }
}
