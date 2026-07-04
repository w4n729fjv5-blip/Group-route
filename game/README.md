# Top-Down Prototype (Zelda-like)

A minimal top-down action-adventure prototype: no story, no combat, just a
single explorable area with movement and collision. Built with React +
TypeScript + Vite, rendered on an HTML5 canvas.

## Run it

```bash
cd game
npm install
npm run dev
```

Open the printed URL (defaults to `http://localhost:5174`).

## Controls

- **Move:** Arrow keys or WASD
- Diagonal movement is normalized (no faster diagonal speed).

## What's here

- A single 20x15 tile area bordered by trees, with a pond, a rock cluster,
  scattered trees, and a dirt path crossing it.
- A player square that moves around the area and collides with solid tiles
  (trees, water, rocks) but walks freely over grass and path tiles.
- A small facing indicator on the player so direction is visible even
  without sprite art.

## Project structure

```
src/
  engine/
    constants.ts   tile size, map size, player speed
    map.ts          tile grid data + collision lookup + rendering
    input.ts        keyboard state
    player.ts       movement, collision, facing, drawing
    GameEngine.ts    requestAnimationFrame game loop
  GameCanvas.tsx    React component that mounts the canvas + engine
  App.tsx           page layout
  main.tsx          React entry point
```

## Next steps (not implemented yet)

- Camera/scrolling for a larger world (currently one fixed screen).
- Sprite art instead of colored rectangles.
- Attack action, enemies, items, or any story content.
