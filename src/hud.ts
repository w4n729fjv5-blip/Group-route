// DOM HUD: hotbar with block icons and selection state.

import { ATLAS_COLS, BLOCKS, getAtlasCanvas, PLACEABLE, TILE_PX } from './blocks';

export class Hud {
  private slots: HTMLDivElement[] = [];
  private selected = 0;

  constructor() {
    const hotbar = document.getElementById('hotbar')!;
    const atlas = getAtlasCanvas();

    PLACEABLE.forEach((id, i) => {
      const def = BLOCKS[id];
      const slot = document.createElement('div');
      slot.className = 'slot';

      // Icon: the block's side tile cropped out of the atlas.
      const tile = def.tiles[2];
      const icon = document.createElement('canvas');
      icon.width = TILE_PX;
      icon.height = TILE_PX;
      const ctx = icon.getContext('2d')!;
      const sx = (tile % ATLAS_COLS) * TILE_PX;
      const sy = Math.floor(tile / ATLAS_COLS) * TILE_PX;
      ctx.drawImage(atlas, sx, sy, TILE_PX, TILE_PX, 0, 0, TILE_PX, TILE_PX);
      slot.style.backgroundImage = `url(${icon.toDataURL()})`;

      const key = document.createElement('span');
      key.className = 'key';
      key.textContent = String(i + 1);
      slot.appendChild(key);

      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = def.name;
      slot.appendChild(name);

      hotbar.appendChild(slot);
      this.slots.push(slot);
    });

    this.select(0);
  }

  select(index: number): void {
    const n = PLACEABLE.length;
    this.selected = ((index % n) + n) % n;
    this.slots.forEach((slot, i) => slot.classList.toggle('selected', i === this.selected));
  }

  scroll(delta: number): void {
    this.select(this.selected + delta);
  }

  get selectedBlock(): number {
    return PLACEABLE[this.selected];
  }
}
