// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gridSize = 20;
const tileCount = 20;

// Snake colors list
const colors = ["black", "brown", "red", "darkblue", "pink", "purple"];
const snakeColor = colors[Math.floor(Math.random() * colors.length)];
const foodColor = snakeColor;

let snake = [{ x: 10, y: 10 }];
let velocity = { x: 0, y: 0 };
let food = randomFood();
let score = 0;
let paused = false;

// Pause button
document.getElementById("pauseBtn").onclick = () => {
    paused = !paused;
    document.getElementById("pauseBtn").innerText = paused ? "Resume" : "Pause";
};

// Game loop
setInterval(gameLoop, 100);

function gameLoop() {
    if (paused) return;

    update();
    draw();
}

function update() {
    // Move snake
    let head = { x: snake[0].x + velocity.x, y: snake[0].y + velocity.y };

    // Game over if hits wall
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        resetGame();
        return;
    }

    // Game over if hits itself
    for (let part of snake) {
        if (head.x === part.x && head.y === part.y) {
            resetGame();
            return;
        }
    }

    snake.unshift(head);

    // Eating food
    if (head.x === food.x && head.y === food.y) {
        score++;
        document.getElementById("score").innerText = score;
        food = randomFood();
    } else {
        snake.pop();
    }
}

function draw() {
    // Clear board
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = "rgba(0,255,0,0.2)";
    for (let i = 0; i < tileCount; i++) {
        for (let j = 0; j < tileCount; j++) {
            ctx.strokeRect(i * gridSize, j * gridSize, gridSize, gridSize);
        }
    }

    // Draw snake
    ctx.fillStyle = snakeColor;
    for (let part of snake) {
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize, gridSize);
    }

    // Draw food
    ctx.fillStyle = foodColor;
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

function randomFood() {
    return {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
}

// Key controls
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && velocity.y !== 1) velocity = { x: 0, y: -1 };
    if (e.key === "ArrowDown" && velocity.y !== -1) velocity = { x: 0, y: 1 };
    if (e.key === "ArrowLeft" && velocity.x !== 1) velocity = { x: -1, y: 0 };
    if (e.key === "ArrowRight" && velocity.x !== -1) velocity = { x: 1, y: 0 };
});

function resetGame() {
    alert("Game Over! Score: " + score);
    snake = [{ x: 10, y: 10 }];
    velocity = { x: 0, y: 0 };
    score = 0;
    document.getElementById("score").innerText = score;
    food = randomFood();
}
