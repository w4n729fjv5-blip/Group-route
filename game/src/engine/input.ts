const MOVE_KEYS = new Set([
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
  "w", "a", "s", "d", "W", "A", "S", "D",
]);

export class Input {
  private pressed = new Set<string>();

  private onKeyDown = (e: KeyboardEvent) => {
    if (MOVE_KEYS.has(e.key)) e.preventDefault();
    this.pressed.add(e.key);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.pressed.delete(e.key);
  };

  attach(): void {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  detach(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }

  get up(): boolean {
    return this.pressed.has("ArrowUp") || this.pressed.has("w") || this.pressed.has("W");
  }
  get down(): boolean {
    return this.pressed.has("ArrowDown") || this.pressed.has("s") || this.pressed.has("S");
  }
  get left(): boolean {
    return this.pressed.has("ArrowLeft") || this.pressed.has("a") || this.pressed.has("A");
  }
  get right(): boolean {
    return this.pressed.has("ArrowRight") || this.pressed.has("d") || this.pressed.has("D");
  }
}
