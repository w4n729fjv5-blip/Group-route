# VoxelCraft

A Minecraft-style voxel game that runs in the browser. Built with TypeScript, Three.js, and Vite — no assets, everything (terrain and textures) is generated procedurally.

## Features

- **Infinite procedural terrain** — hills, beaches, lakes, and trees generated from seeded value noise, streamed in as 16×80×16 chunks around the player.
- **First-person controls** — pointer-lock mouse look, WASD movement, jumping, sprinting, and a fly mode.
- **Block breaking & placing** — voxel raycasting picks the targeted block (wireframe highlight); left click breaks, right click places.
- **Hotbar** — 9 placeable block types (grass, dirt, stone, sand, log, leaves, plank, cobble, glass), selected with the number keys or mouse wheel.
- **Procedural textures** — a pixel-art texture atlas painted onto a canvas at startup; no image files.
- **Physics** — gravity, jump, and swept AABB collision against the voxel grid; water is swimmable-through (non-solid).

## Controls

| Input | Action |
| --- | --- |
| Mouse | Look around |
| W / A / S / D | Move |
| Space | Jump (fly up in fly mode) |
| Shift | Sprint (fly down in fly mode) |
| Left click | Break block |
| Right click | Place block |
| 1–9 / mouse wheel | Select hotbar block |
| F | Toggle fly mode |
| Esc | Release the mouse |

## Development

```bash
npm install
npm run dev      # start dev server at http://localhost:5173
npm run build    # type-check and build for production
npm run preview  # preview the production build
```

## Project structure

```
src/
  main.ts     — renderer setup, input handling, game loop
  world.ts    — chunk storage, streaming, and mesh building
  terrain.ts  — procedural terrain generation (heightmap, water, trees)
  blocks.ts   — block definitions and the procedural texture atlas
  player.ts   — movement physics and voxel collision
  raycast.ts  — voxel DDA raycast for block picking
  hud.ts      — hotbar UI
  noise.ts    — seeded value noise / FBM
```
