import { CANVAS_WIDTH, CANVAS_HEIGHT, MAP_COLS, MAP_ROWS, TILE_SIZE } from "./constants";
import { GameMap } from "./map";
import { Input } from "./input";
import { Player } from "./player";

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private map = new GameMap();
  private input = new Input();
  private player = new Player(
    ((MAP_COLS / 2) | 0) * TILE_SIZE,
    ((MAP_ROWS / 2) | 0) * TILE_SIZE,
  );
  private lastTime = 0;
  private frameId = 0;
  private running = false;

  constructor(canvas: HTMLCanvasElement) {
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;
  }

  start(): void {
    this.input.attach();
    this.running = true;
    this.lastTime = performance.now();
    this.frameId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frameId);
    this.input.detach();
  }

  private loop = (time: number): void => {
    if (!this.running) return;
    const dt = Math.min((time - this.lastTime) / 1000, 1 / 30);
    this.lastTime = time;

    this.player.update(dt, this.input, this.map);
    this.render();

    this.frameId = requestAnimationFrame(this.loop);
  };

  private render(): void {
    this.map.draw(this.ctx);
    this.player.draw(this.ctx);
  }
}
