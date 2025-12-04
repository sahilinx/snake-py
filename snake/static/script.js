/* static/script.js
   Complete, safe replacement to stop repeated "Game Over" popups.
   - Replaces blocking alert() with a non-blocking overlay.
   - Uses an isGameOver flag so reset happens only once.
   - Ensures apple doesn't spawn on the snake.
   - Draws a 20x20 grid.
   - Simple tick-based loop (100ms).
*/

(() => {
  // Configuration
  const CELL_COUNT = 20;            // 20 x 20 grid
  const CELL_SIZE = 20;            // pixels per cell (so canvas will be 400x400)
  const TICK_MS = 100;            // game tick interval (ms). Increase to slow game.

  // Elements
  const canvas = document.getElementById("gameCanvas");
  if (!canvas) {
    console.error("gameCanvas not found!");
    return;
  }
  const ctx = canvas.getContext("2d");

  // Set canvas size explicitly (in case HTML had different values)
  canvas.width = CELL_COUNT * CELL_SIZE;
  canvas.height = CELL_COUNT * CELL_SIZE;

  // Overlay for non-blocking "Game Over"
  let overlay = document.getElementById("gameOverOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "gameOverOverlay";
    Object.assign(overlay.style, {
      position: "absolute",
      left: canvas.offsetLeft + "px",
      top: (canvas.offsetTop - 10) + "px",
      width: canvas.width + "px",
      height: canvas.height + "px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none",
      zIndex: 9999,
      fontFamily: "Arial, sans-serif",
      color: "#fff",
    });
    document.body.appendChild(overlay);
  }

  function showOverlay(text) {
    overlay.style.pointerEvents = "none";
    overlay.innerHTML = `<div style="
        background: rgba(0,0,0,0.65);
        padding: 16px 22px;
        border-radius: 8px;
        box-shadow: 0 6px 18px rgba(0,0,0,0.4);
        font-size: 18px;
        text-align:center;
    ">${text}</div>`;
    overlay.style.display = "flex";
  }
  function hideOverlay() {
    overlay.style.display = "none";
  }

  // Game state
  const grid = CELL_SIZE;
  let snake = {
    x: Math.floor(CELL_COUNT / 2) * grid,
    y: Math.floor(CELL_COUNT / 2) * grid,
    dx: grid,
    dy: 0,
    cells: [],
    maxCells: 4,
  };
  let apple = { x: 5 * grid, y: 5 * grid };
  let score = 0;
  let isGameOver = false;
  let lastResetAt = 0;

  // Utility: random integer from 0..(CELL_COUNT-1)
  function randCell() {
    return Math.floor(Math.random() * CELL_COUNT) * grid;
  }

  // Make sure apple doesn't spawn on snake
  function placeAppleNotOnSnake() {
    let tries = 0;
    do {
      apple.x = randCell();
      apple.y = randCell();
      tries++;
      if (tries > 500) break; // safety
    } while (snake.cells.some(c => c.x === apple.x && c.y === apple.y));
  }

  // Reset / Game over handler (non-blocking)
  function handleGameOver() {
    if (isGameOver) return;
    isGameOver = true;
    score = snake.maxCells - 4;
    showOverlay(`Game Over! Score: ${score}`);

    // Hide overlay and fully reset after a short delay (1s)
    setTimeout(() => {
      // reset snake
      snake.x = Math.floor(CELL_COUNT / 2) * grid;
      snake.y = Math.floor(CELL_COUNT / 2) * grid;
      snake.cells = [];
      snake.maxCells = 4;
      snake.dx = grid;
      snake.dy = 0;

      score = 0;
      placeAppleNotOnSnake();

      hideOverlay();
      // slight debounce to avoid immediate re-trigger
      lastResetAt = Date.now();
      // allow next ticks to proceed
      isGameOver = false;
    }, 1000);
  }

  // Draw grid, snake, apple
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // background (very light green)
    ctx.fillStyle = "#e8f7e8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw grid lines (thin green)
    ctx.beginPath();
    for (let i = 0; i <= CELL_COUNT; i++) {
      const pos = i * grid;
      // vertical lines
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, canvas.height);
      // horizontal lines
      ctx.moveTo(0, pos);
      ctx.lineTo(canvas.width, pos);
    }
    ctx.strokeStyle = "rgba(0,120,0,0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.closePath();

    // draw apple
    ctx.fillStyle = "#d24d6a"; // pinkish/red
    ctx.fillRect(apple.x + 1, apple.y + 1, grid - 2, grid - 2);

    // draw snake
    ctx.fillStyle = "#111"; // black snake
    for (let i = 0; i < snake.cells.length; i++) {
      const cell = snake.cells[i];
      ctx.fillRect(cell.x + 1, cell.y + 1, grid - 2, grid - 2);
    }
  }

  // Game update tick
  function update() {
    // If game is in transition (recent reset), skip updates briefly
    if (isGameOver) return;
    if (Date.now() - lastResetAt < 50) return;

    // move snake head
    snake.x += snake.dx;
    snake.y += snake.dy;

    // wrap
    if (snake.x < 0) snake.x = canvas.width - grid;
    else if (snake.x >= canvas.width) snake.x = 0;
    if (snake.y < 0) snake.y = canvas.height - grid;
    else if (snake.y >= canvas.height) snake.y = 0;

    // add new head position to cells
    snake.cells.unshift({ x: snake.x, y: snake.y });

    // trim tail
    while (snake.cells.length > snake.maxCells) {
      snake.cells.pop();
    }

    // check apple collision
    if (snake.x === apple.x && snake.y === apple.y) {
      snake.maxCells++;
      score = snake.maxCells - 4;
      placeAppleNotOnSnake();
      // optional: update a score element if you have one
      const scoreElem = document.getElementById("scoreValue");
      if (scoreElem) scoreElem.textContent = score;
    }

    // check self-collision
    // We must not reset *inside* this loop with blocking calls.
    for (let i = 1; i < snake.cells.length; i++) {
      if (snake.cells[i].x === snake.x && snake.cells[i].y === snake.y) {
        handleGameOver();
        break;
      }
    }
  }

  // Keyboard controls
  document.addEventListener("keydown", (e) => {
    // ignore if game over transition is happening
    if (isGameOver) return;

    if (e.key === "ArrowLeft" || e.key === "a") {
      if (snake.dx === 0) {
        snake.dx = -grid; snake.dy = 0;
      }
    } else if (e.key === "ArrowUp" || e.key === "w") {
      if (snake.dy === 0) {
        snake.dx = 0; snake.dy = -grid;
      }
    } else if (e.key === "ArrowRight" || e.key === "d") {
      if (snake.dx === 0) {
        snake.dx = grid; snake.dy = 0;
      }
    } else if (e.key === "ArrowDown" || e.key === "s") {
      if (snake.dy === 0) {
        snake.dx = 0; snake.dy = grid;
      }
    }
  });

  // Optional: Pause button support if you have a button with id "pauseBtn"
  const pauseBtn = document.getElementById("pauseBtn");
  let isPaused = false;
  if (pauseBtn) {
    pauseBtn.addEventListener("click", () => {
      isPaused = !isPaused;
      pauseBtn.textContent = isPaused ? "Resume" : "Pause";
    });
  }

  // Main loop via setInterval (stable tick)
  setInterval(() => {
    if (!isPaused) update();
    draw();
  }, TICK_MS);

  // initial placement
  placeAppleNotOnSnake();
  hideOverlay();

  // If you have an element to show score, create/update it
  (function ensureScoreElement() {
    let s = document.getElementById("scoreValue");
    if (!s) {
      s = document.createElement("div");
      s.id = "scoreValue";
      s.style.position = "relative";
      s.style.textAlign = "center";
      s.style.marginTop = "8px";
      s.style.fontFamily = "Arial, sans-serif";
      s.style.color = "#333";
      s.textContent = "0";
      // attempt to insert under the canvas if a parent exists
      canvas.parentNode && canvas.parentNode.insertBefore(s, canvas.nextSibling);
    }
  })();

})();

