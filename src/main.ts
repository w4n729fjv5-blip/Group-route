// Entry point: renderer, input, and the game loop.

import * as THREE from 'three';
import { Block } from './blocks';
import { Hud } from './hud';
import { EYE_HEIGHT, InputState, Player } from './player';
import { raycastBlocks } from './raycast';
import { CHUNK_SIZE } from './terrain';
import { RENDER_DISTANCE, World } from './world';

const REACH = 6;

const app = document.getElementById('app')!;
const overlay = document.getElementById('overlay')!;
const debugEl = document.getElementById('debug')!;

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const skyColor = new THREE.Color(0x87ceeb);
scene.background = skyColor;
const viewDistance = RENDER_DISTANCE * CHUNK_SIZE;
scene.fog = new THREE.Fog(skyColor, viewDistance * 0.55, viewDistance * 0.95);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 600);

const world = new World(scene);
const player = new Player(world);
const hud = new Hud();

// Wireframe highlight around the targeted block.
const highlight = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)),
  new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.6 }),
);
highlight.visible = false;
scene.add(highlight);

const input: InputState = {
  forward: false,
  back: false,
  left: false,
  right: false,
  jump: false,
  down: false,
  sprint: false,
};

let locked = false;

overlay.addEventListener('click', () => {
  renderer.domElement.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === renderer.domElement;
  overlay.style.display = locked ? 'none' : 'flex';
});

document.addEventListener('mousemove', (e) => {
  if (!locked) return;
  const sensitivity = 0.0024;
  player.yaw -= e.movementX * sensitivity;
  player.pitch -= e.movementY * sensitivity;
  const limit = Math.PI / 2 - 0.01;
  player.pitch = Math.max(-limit, Math.min(limit, player.pitch));
});

document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  switch (e.code) {
    case 'KeyW': input.forward = true; break;
    case 'KeyS': input.back = true; break;
    case 'KeyA': input.left = true; break;
    case 'KeyD': input.right = true; break;
    case 'Space': input.jump = true; e.preventDefault(); break;
    case 'ShiftLeft':
    case 'ShiftRight':
      input.sprint = true;
      input.down = true;
      break;
    case 'KeyF':
      player.flying = !player.flying;
      player.velocity.y = 0;
      break;
    default:
      if (e.code.startsWith('Digit')) {
        const n = Number(e.code.slice(5));
        if (n >= 1 && n <= 9) hud.select(n - 1);
      }
  }
});

document.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'KeyW': input.forward = false; break;
    case 'KeyS': input.back = false; break;
    case 'KeyA': input.left = false; break;
    case 'KeyD': input.right = false; break;
    case 'Space': input.jump = false; break;
    case 'ShiftLeft':
    case 'ShiftRight':
      input.sprint = false;
      input.down = false;
      break;
  }
});

document.addEventListener('wheel', (e) => {
  if (!locked) return;
  hud.scroll(e.deltaY > 0 ? 1 : -1);
});

renderer.domElement.addEventListener('mousedown', (e) => {
  if (!locked) return;
  const hit = raycastBlocks(world, player.eyePosition, player.lookDirection(), REACH);
  if (!hit) return;

  if (e.button === 0) {
    if (hit.id !== Block.Bedrock) {
      world.setBlock(hit.block.x, hit.block.y, hit.block.z, Block.Air);
    }
  } else if (e.button === 2) {
    const { x, y, z } = hit.adjacent;
    const target = world.getBlock(x, y, z);
    const replaceable = target === Block.Air || target === Block.Water;
    if (replaceable && !player.intersectsBlock(x, y, z)) {
      world.setBlock(x, y, z, hud.selectedBlock);
    }
  }
});

document.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let lastTime = performance.now();
let fpsTime = 0;
let fpsFrames = 0;
let fps = 0;

function frame(now: number): void {
  requestAnimationFrame(frame);
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  fpsFrames++;
  fpsTime += dt;
  if (fpsTime >= 0.5) {
    fps = Math.round(fpsFrames / fpsTime);
    fpsFrames = 0;
    fpsTime = 0;
  }

  if (locked) player.update(dt, input);
  world.update(player.position.x, player.position.z);

  camera.position.set(player.position.x, player.position.y + EYE_HEIGHT, player.position.z);
  camera.rotation.set(0, 0, 0);
  camera.rotateY(player.yaw);
  camera.rotateX(player.pitch);

  const hit = locked ? raycastBlocks(world, player.eyePosition, player.lookDirection(), REACH) : null;
  if (hit) {
    highlight.position.set(hit.block.x + 0.5, hit.block.y + 0.5, hit.block.z + 0.5);
    highlight.visible = true;
  } else {
    highlight.visible = false;
  }

  const p = player.position;
  debugEl.textContent =
    `${fps} fps\n` +
    `xyz: ${p.x.toFixed(1)} / ${p.y.toFixed(1)} / ${p.z.toFixed(1)}` +
    (player.flying ? '  [flying]' : '');

  renderer.render(scene, camera);
}

requestAnimationFrame(frame);

// Dev hook for debugging/automation (harmless in production).
(window as unknown as Record<string, unknown>).__game = { player, world, hud };
