"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Difficulty = "easy" | "medium" | "hard";

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 600;
const PADDLE_HEIGHT = 12;
const BALL_RADIUS = 6;

const difficultyConfig: Record<
  Difficulty,
  { rows: number; cols: number; ballSpeed: number; paddleWidth: number }
> = {
  easy: { rows: 3, cols: 8, ballSpeed: 3, paddleWidth: 100 },
  medium: { rows: 4, cols: 8, ballSpeed: 4.5, paddleWidth: 80 },
  hard: { rows: 5, cols: 10, ballSpeed: 6, paddleWidth: 60 },
};

const ROW_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
];

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
  color: string;
}

function createBricks(rows: number, cols: number): Brick[] {
  const brickW = (CANVAS_WIDTH - (cols + 1) * 4) / cols;
  const brickH = 18;
  const bricks: Brick[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      bricks.push({
        x: 4 + c * (brickW + 4),
        y: 60 + r * (brickH + 4),
        w: brickW,
        h: brickH,
        alive: true,
        color: ROW_COLORS[r % ROW_COLORS.length],
      });
    }
  }
  return bricks;
}

export function BreakoutGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<"idle" | "playing" | "won" | "lost">("idle");
  const [highScores, setHighScores] = useState<Record<Difficulty, number>>({
    easy: 0,
    medium: 0,
    hard: 0,
  });

  const gameRef = useRef({
    paddleX: CANVAS_WIDTH / 2,
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT - 40,
    ballDx: 0,
    ballDy: 0,
    bricks: [] as Brick[],
    score: 0,
    lives: 3,
    launched: false,
  });

  const animFrameRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());

  const config = difficultyConfig[difficulty];

  const initGame = useCallback(() => {
    const g = gameRef.current;
    g.paddleX = CANVAS_WIDTH / 2;
    g.ballX = CANVAS_WIDTH / 2;
    g.ballY = CANVAS_HEIGHT - 40;
    g.ballDx = 0;
    g.ballDy = 0;
    g.bricks = createBricks(config.rows, config.cols);
    g.score = 0;
    g.lives = 3;
    g.launched = false;
    setScore(0);
    setLives(3);
    setGameState("idle");
  }, [config]);

  const resetBall = useCallback(() => {
    const g = gameRef.current;
    g.ballX = g.paddleX;
    g.ballY = CANVAS_HEIGHT - 40;
    g.ballDx = 0;
    g.ballDy = 0;
    g.launched = false;
  }, []);

  const launchBall = useCallback(() => {
    const g = gameRef.current;
    if (g.launched) return;
    g.launched = true;
    const angle = -Math.PI / 4 + Math.random() * (-Math.PI / 2 + Math.PI / 4);
    g.ballDx = config.ballSpeed * Math.sin(angle);
    g.ballDy = -config.ballSpeed * Math.cos(angle);
  }, [config.ballSpeed]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing" && gameState !== "idle") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const g = gameRef.current;

    function update() {
      // Paddle movement
      const paddleSpeed = 7;
      if (keysRef.current.has("ArrowLeft") || keysRef.current.has("a")) {
        g.paddleX = Math.max(config.paddleWidth / 2, g.paddleX - paddleSpeed);
      }
      if (keysRef.current.has("ArrowRight") || keysRef.current.has("d")) {
        g.paddleX = Math.min(CANVAS_WIDTH - config.paddleWidth / 2, g.paddleX + paddleSpeed);
      }

      if (!g.launched) {
        g.ballX = g.paddleX;
        g.ballY = CANVAS_HEIGHT - 40;
        return;
      }

      // Ball movement
      g.ballX += g.ballDx;
      g.ballY += g.ballDy;

      // Wall collisions
      if (g.ballX - BALL_RADIUS <= 0 || g.ballX + BALL_RADIUS >= CANVAS_WIDTH) {
        g.ballDx = -g.ballDx;
        g.ballX = Math.max(BALL_RADIUS, Math.min(CANVAS_WIDTH - BALL_RADIUS, g.ballX));
      }
      if (g.ballY - BALL_RADIUS <= 0) {
        g.ballDy = -g.ballDy;
        g.ballY = BALL_RADIUS;
      }

      // Paddle collision
      const paddleLeft = g.paddleX - config.paddleWidth / 2;
      const paddleRight = g.paddleX + config.paddleWidth / 2;
      const paddleTop = CANVAS_HEIGHT - 28;

      if (
        g.ballDy > 0 &&
        g.ballY + BALL_RADIUS >= paddleTop &&
        g.ballY + BALL_RADIUS <= paddleTop + PADDLE_HEIGHT + 4 &&
        g.ballX >= paddleLeft &&
        g.ballX <= paddleRight
      ) {
        const hitPos = (g.ballX - paddleLeft) / config.paddleWidth;
        const angle = -Math.PI / 3 + hitPos * (Math.PI / 3 * 2);
        const speed = Math.sqrt(g.ballDx * g.ballDx + g.ballDy * g.ballDy);
        g.ballDx = speed * Math.sin(angle);
        g.ballDy = -speed * Math.cos(angle);
        g.ballY = paddleTop - BALL_RADIUS;
      }

      // Ball falls below
      if (g.ballY - BALL_RADIUS > CANVAS_HEIGHT) {
        g.lives--;
        setLives(g.lives);
        if (g.lives <= 0) {
          setGameState("lost");
          return;
        }
        resetBall();
      }

      // Brick collision
      for (const brick of g.bricks) {
        if (!brick.alive) continue;

        if (
          g.ballX + BALL_RADIUS > brick.x &&
          g.ballX - BALL_RADIUS < brick.x + brick.w &&
          g.ballY + BALL_RADIUS > brick.y &&
          g.ballY - BALL_RADIUS < brick.y + brick.h
        ) {
          brick.alive = false;
          g.score += 10;
          setScore(g.score);

          // Determine collision side
          const overlapLeft = g.ballX + BALL_RADIUS - brick.x;
          const overlapRight = brick.x + brick.w - (g.ballX - BALL_RADIUS);
          const overlapTop = g.ballY + BALL_RADIUS - brick.y;
          const overlapBottom = brick.y + brick.h - (g.ballY - BALL_RADIUS);

          const minOverlapX = Math.min(overlapLeft, overlapRight);
          const minOverlapY = Math.min(overlapTop, overlapBottom);

          if (minOverlapX < minOverlapY) {
            g.ballDx = -g.ballDx;
          } else {
            g.ballDy = -g.ballDy;
          }
          break;
        }
      }

      // Check win
      if (g.bricks.every((b) => !b.alive)) {
        setHighScores((prev) => ({
          ...prev,
          [difficulty]: Math.max(prev[difficulty], g.score),
        }));
        setGameState("won");
      }
    }

    function draw() {
      if (!ctx) return;

      // Background
      ctx.fillStyle = "#18181b";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Bricks
      for (const brick of g.bricks) {
        if (!brick.alive) continue;
        ctx.fillStyle = brick.color;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 3);
        ctx.fill();
      }

      // Paddle
      ctx.fillStyle = "#e4e4e7";
      ctx.beginPath();
      ctx.roundRect(
        g.paddleX - config.paddleWidth / 2,
        CANVAS_HEIGHT - 28,
        config.paddleWidth,
        PADDLE_HEIGHT,
        6
      );
      ctx.fill();

      // Ball
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(g.ballX, g.ballY, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    function loop() {
      update();
      draw();
      animFrameRef.current = requestAnimationFrame(loop);
    }

    animFrameRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameState, config, difficulty, resetBall]);

  // Keyboard input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      keysRef.current.add(e.key);
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        if (gameState === "idle") {
          setGameState("playing");
          launchBall();
        } else if (gameState === "playing" && !gameRef.current.launched) {
          launchBall();
        }
      }
    }
    function handleKeyUp(e: KeyboardEvent) {
      keysRef.current.delete(e.key);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState, launchBall]);

  // Mouse/touch paddle control
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function handlePointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const x = (e.clientX - rect.left) * scaleX;
      gameRef.current.paddleX = Math.max(
        config.paddleWidth / 2,
        Math.min(CANVAS_WIDTH - config.paddleWidth / 2, x)
      );
    }

    function handleClick() {
      if (gameState === "idle") {
        setGameState("playing");
        launchBall();
      } else if (gameState === "playing" && !gameRef.current.launched) {
        launchBall();
      }
    }

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("click", handleClick);
    return () => {
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("click", handleClick);
    };
  }, [config.paddleWidth, gameState, launchBall]);

  // Init on mount / difficulty change
  useEffect(() => {
    initGame();
  }, [initGame]);

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold">Breakout</h1>

      {/* Settings */}
      <div className="flex flex-wrap gap-6 items-center justify-center text-sm">
        <div className="flex items-center gap-2">
          <label className="font-medium text-zinc-600 dark:text-zinc-400">
            Difficulty:
          </label>
          <select
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value as Difficulty);
            }}
            className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm"
            disabled={gameState === "playing"}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-8 text-sm text-zinc-500 dark:text-zinc-400">
        <div className="text-center">
          <p className="font-medium">Score</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {score}
          </p>
        </div>
        <div className="text-center">
          <p className="font-medium">Lives</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {"❤️".repeat(lives)}
          </p>
        </div>
        {highScores[difficulty] > 0 && (
          <div className="text-center">
            <p className="font-medium">Best</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {highScores[difficulty]}
            </p>
          </div>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="rounded-lg border-2 border-zinc-700 cursor-none max-w-full"
        style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
      />

      {/* Status overlay */}
      {gameState === "idle" && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Click or press Space to launch the ball. Use mouse or arrow keys to move the paddle.
        </p>
      )}
      {gameState === "won" && (
        <p className="text-lg font-medium text-green-600 dark:text-green-400">
          You cleared all bricks! Score: {score}
        </p>
      )}
      {gameState === "lost" && (
        <p className="text-lg font-medium text-red-600 dark:text-red-400">
          Game Over! Score: {score}
        </p>
      )}

      {/* Play again */}
      {(gameState === "won" || gameState === "lost") && (
        <button
          onClick={initGame}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
        >
          Play Again
        </button>
      )}
    </div>
  );
}
