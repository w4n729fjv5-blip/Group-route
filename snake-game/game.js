(() => {
  const GRID_SIZE = 20;
  const START_LENGTH = 3;
  const START_INTERVAL_MS = 140;
  const MIN_INTERVAL_MS = 60;
  const SPEEDUP_EVERY_N_FOODS = 5;
  const SPEEDUP_STEP_MS = 10;
  const BEST_KEY = "snake-best-score";

  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const overlayEl = document.getElementById("overlay");
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const touchControls = document.getElementById("touchControls");

  const cellSize = canvas.width / GRID_SIZE;

  const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const isOpposite = (a, b) => a.x === -b.x && a.y === -b.y;

  let snake, direction, pendingDir, food, score, best, intervalMs, timerId, state;

  function loadBest() {
    const raw = localStorage.getItem(BEST_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  }

  function saveBest(value) {
    localStorage.setItem(BEST_KEY, String(value));
  }

  function randomEmptyCell() {
    while (true) {
      const cell = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!snake.some((s) => s.x === cell.x && s.y === cell.y)) return cell;
    }
  }

  function resetGame() {
    const startX = Math.floor(GRID_SIZE / 2);
    const startY = Math.floor(GRID_SIZE / 2);
    snake = [];
    for (let i = 0; i < START_LENGTH; i++) {
      snake.push({ x: startX - i, y: startY });
    }
    direction = { ...DIRS.right };
    pendingDir = { ...DIRS.right };
    score = 0;
    intervalMs = START_INTERVAL_MS;
    food = randomEmptyCell();
    updateScore();
  }

  function updateScore() {
    scoreEl.textContent = String(score);
    bestEl.textContent = String(best);
  }

  function setDirection(name) {
    const next = DIRS[name];
    if (!next) return;
    if (isOpposite(next, direction)) return;
    pendingDir = next;
  }

  function tick() {
    direction = pendingDir;
    const head = snake[0];
    const newHead = { x: head.x + direction.x, y: head.y + direction.y };

    const hitWall =
      newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE;
    const hitSelf = snake.some((s) => s.x === newHead.x && s.y === newHead.y);

    if (hitWall || hitSelf) {
      gameOver();
      return;
    }

    snake.unshift(newHead);

    if (newHead.x === food.x && newHead.y === food.y) {
      score += 1;
      if (score % SPEEDUP_EVERY_N_FOODS === 0) {
        intervalMs = Math.max(MIN_INTERVAL_MS, intervalMs - SPEEDUP_STEP_MS);
        restartTimer();
      }
      food = randomEmptyCell();
      updateScore();
    } else {
      snake.pop();
    }

    draw();
  }

  function draw() {
    ctx.fillStyle = "#1a2740";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ef4444";
    ctx.fillRect(food.x * cellSize + 2, food.y * cellSize + 2, cellSize - 4, cellSize - 4);

    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? "#22c55e" : "#16a34a";
      ctx.fillRect(
        segment.x * cellSize + 1,
        segment.y * cellSize + 1,
        cellSize - 2,
        cellSize - 2
      );
    });
  }

  function restartTimer() {
    clearInterval(timerId);
    timerId = setInterval(tick, intervalMs);
  }

  function startGame() {
    resetGame();
    state = "playing";
    overlayEl.classList.add("hidden");
    pauseBtn.textContent = "⏸";
    draw();
    restartTimer();
  }

  function gameOver() {
    state = "gameover";
    clearInterval(timerId);
    if (score > best) {
      best = score;
      saveBest(best);
    }
    updateScore();
    overlayEl.querySelector("h1").textContent = "Game Over";
    overlayEl.querySelector("p").textContent = `Score: ${score} — tap play to try again.`;
    startBtn.textContent = "Play Again";
    overlayEl.classList.remove("hidden");
  }

  function togglePause() {
    if (state === "playing") {
      state = "paused";
      clearInterval(timerId);
      pauseBtn.textContent = "▶";
    } else if (state === "paused") {
      state = "playing";
      restartTimer();
      pauseBtn.textContent = "⏸";
    }
  }

  const KEY_MAP = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    s: "down",
    a: "left",
    d: "right",
    W: "up",
    S: "down",
    A: "left",
    D: "right",
  };

  document.addEventListener("keydown", (e) => {
    if (KEY_MAP[e.key]) {
      e.preventDefault();
      if (state === "idle" || state === "gameover") {
        startGame();
      }
      setDirection(KEY_MAP[e.key]);
    } else if (e.key === " ") {
      e.preventDefault();
      if (state === "idle" || state === "gameover") {
        startGame();
      } else {
        togglePause();
      }
    }
  });

  startBtn.addEventListener("click", startGame);
  pauseBtn.addEventListener("click", togglePause);

  touchControls.addEventListener("click", (e) => {
    const btn = e.target.closest(".pad-btn");
    if (!btn) return;
    if (state === "idle" || state === "gameover") {
      startGame();
    }
    setDirection(btn.dataset.dir);
  });

  let touchStart = null;
  canvas.addEventListener(
    "touchstart",
    (e) => {
      const t = e.changedTouches[0];
      touchStart = { x: t.clientX, y: t.clientY };
    },
    { passive: true }
  );

  canvas.addEventListener(
    "touchend",
    (e) => {
      if (!touchStart) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      touchStart = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;

      if (state === "idle" || state === "gameover") {
        startGame();
      }
      if (Math.abs(dx) > Math.abs(dy)) {
        setDirection(dx > 0 ? "right" : "left");
      } else {
        setDirection(dy > 0 ? "down" : "up");
      }
    },
    { passive: true }
  );

  function init() {
    best = loadBest();
    state = "idle";
    resetGame();
    draw();
    updateScore();
  }

  init();
})();
