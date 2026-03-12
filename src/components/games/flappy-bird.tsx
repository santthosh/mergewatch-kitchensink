"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BIRD_SIZE = 24;
const BIRD_X = 80;
const GRAVITY = 0.45;
const JUMP_VELOCITY = -7.5;
const PIPE_WIDTH = 52;
const PIPE_GAP = 150;
const PIPE_SPEED = 2.5;
const PIPE_SPAWN_INTERVAL = 100; // frames

interface Bird {
  y: number;
  velocity: number;
}

interface Pipe {
  x: number;
  topHeight: number;
  scored: boolean;
}

type GameState = "idle" | "playing" | "dead";

function useFlappyBird() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const birdRef = useRef<Bird>({ y: CANVAS_HEIGHT / 2, velocity: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const frameCountRef = useRef(0);
  const scoreRef = useRef(0);
  const gameStateRef = useRef<GameState>("idle");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const resetGame = useCallback(() => {
    birdRef.current = { y: CANVAS_HEIGHT / 2, velocity: 0 };
    pipesRef.current = [];
    frameCountRef.current = 0;
    scoreRef.current = 0;
    setScore(0);
  }, []);

  const jump = useCallback(() => {
    if (gameStateRef.current === "idle") {
      resetGame();
      gameStateRef.current = "playing";
      setGameState("playing");
    }
    if (gameStateRef.current === "dead") {
      resetGame();
      gameStateRef.current = "playing";
      setGameState("playing");
    }
    if (gameStateRef.current === "playing") {
      birdRef.current.velocity = JUMP_VELOCITY;
    }
  }, [resetGame]);

  const drawBird = useCallback((ctx: CanvasRenderingContext2D, y: number, velocity: number) => {
    ctx.save();
    ctx.translate(BIRD_X + BIRD_SIZE / 2, y + BIRD_SIZE / 2);
    const angle = Math.min(Math.max(velocity * 3, -30), 70) * (Math.PI / 180);
    ctx.rotate(angle);

    // Body
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    ctx.fillStyle = "#eab308";
    ctx.beginPath();
    ctx.ellipse(-2, 3, 8, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(6, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(7.5, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(18, 2);
    ctx.lineTo(10, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }, []);

  const drawPipe = useCallback((ctx: CanvasRenderingContext2D, pipe: Pipe) => {
    const { x, topHeight } = pipe;
    const bottomY = topHeight + PIPE_GAP;

    // Top pipe
    ctx.fillStyle = "#16a34a";
    ctx.fillRect(x, 0, PIPE_WIDTH, topHeight);
    ctx.fillStyle = "#15803d";
    ctx.fillRect(x - 3, topHeight - 24, PIPE_WIDTH + 6, 24);

    // Bottom pipe
    ctx.fillStyle = "#16a34a";
    ctx.fillRect(x, bottomY, PIPE_WIDTH, CANVAS_HEIGHT - bottomY);
    ctx.fillStyle = "#15803d";
    ctx.fillRect(x - 3, bottomY, PIPE_WIDTH + 6, 24);

    // Pipe borders
    ctx.strokeStyle = "#166534";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 0, PIPE_WIDTH, topHeight);
    ctx.strokeRect(x - 3, topHeight - 24, PIPE_WIDTH + 6, 24);
    ctx.strokeRect(x, bottomY, PIPE_WIDTH, CANVAS_HEIGHT - bottomY);
    ctx.strokeRect(x - 3, bottomY, PIPE_WIDTH + 6, 24);
  }, []);

  const drawGround = useCallback((ctx: CanvasRenderingContext2D, frame: number) => {
    const groundY = CANVAS_HEIGHT - 50;
    ctx.fillStyle = "#854d0e";
    ctx.fillRect(0, groundY, CANVAS_WIDTH, 50);
    ctx.fillStyle = "#a16207";
    ctx.fillRect(0, groundY, CANVAS_WIDTH, 8);

    // Ground texture lines
    ctx.strokeStyle = "#92400e";
    ctx.lineWidth = 1;
    const offset = (frame * PIPE_SPEED) % 20;
    for (let x = -offset; x < CANVAS_WIDTH; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, groundY + 12);
      ctx.lineTo(x + 10, groundY + 22);
      ctx.stroke();
    }
  }, []);

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, "#7dd3fc");
    gradient.addColorStop(0.7, "#bae6fd");
    gradient.addColorStop(1, "#e0f2fe");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Clouds
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    for (const [cx, cy, r] of [[60, 80, 25], [90, 70, 30], [120, 80, 25], [280, 120, 20], [310, 110, 28], [340, 120, 20]]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  const checkCollision = useCallback((bird: Bird, pipes: Pipe[]): boolean => {
    const birdTop = bird.y + 2;
    const birdBottom = bird.y + BIRD_SIZE - 2;
    const birdLeft = BIRD_X + 2;
    const birdRight = BIRD_X + BIRD_SIZE - 2;

    // Ground / ceiling
    if (birdBottom >= CANVAS_HEIGHT - 50 || birdTop <= 0) return true;

    for (const pipe of pipes) {
      const pipeLeft = pipe.x;
      const pipeRight = pipe.x + PIPE_WIDTH;

      if (birdRight > pipeLeft && birdLeft < pipeRight) {
        if (birdTop < pipe.topHeight || birdBottom > pipe.topHeight + PIPE_GAP) {
          return true;
        }
      }
    }
    return false;
  }, []);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameStateRef.current;
    const bird = birdRef.current;
    const pipes = pipesRef.current;

    // Update
    if (state === "playing") {
      bird.velocity += GRAVITY;
      bird.y += bird.velocity;
      frameCountRef.current++;

      // Spawn pipes
      if (frameCountRef.current % PIPE_SPAWN_INTERVAL === 0) {
        const minTop = 60;
        const maxTop = CANVAS_HEIGHT - 50 - PIPE_GAP - 60;
        const topHeight = minTop + Math.random() * (maxTop - minTop);
        pipes.push({ x: CANVAS_WIDTH, topHeight, scored: false });
      }

      // Move pipes and score
      for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED;

        if (!pipes[i].scored && pipes[i].x + PIPE_WIDTH < BIRD_X) {
          pipes[i].scored = true;
          scoreRef.current++;
          setScore(scoreRef.current);
        }

        if (pipes[i].x + PIPE_WIDTH < -10) {
          pipes.splice(i, 1);
        }
      }

      // Collision
      if (checkCollision(bird, pipes)) {
        gameStateRef.current = "dead";
        setGameState("dead");
        setBestScore((prev) => Math.max(prev, scoreRef.current));
      }
    }

    // Draw
    drawBackground(ctx);

    // Pipes
    for (const pipe of pipes) {
      drawPipe(ctx, pipe);
    }

    drawGround(ctx, state === "playing" ? frameCountRef.current : 0);

    // Bird
    const displayY = state === "idle" ? CANVAS_HEIGHT / 2 + Math.sin(Date.now() / 200) * 8 : bird.y;
    drawBird(ctx, displayY, state === "idle" ? 0 : bird.velocity);

    // Score display during play
    if (state === "playing" || state === "dead") {
      ctx.fillStyle = "white";
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 4;
      ctx.font = "bold 48px sans-serif";
      ctx.textAlign = "center";
      ctx.strokeText(String(scoreRef.current), CANVAS_WIDTH / 2, 60);
      ctx.fillText(String(scoreRef.current), CANVAS_WIDTH / 2, 60);
    }

    // Idle overlay
    if (state === "idle") {
      ctx.fillStyle = "white";
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 3;
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.strokeText("Click or Press Space", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
      ctx.fillText("Click or Press Space", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
      ctx.font = "bold 18px sans-serif";
      ctx.strokeText("to start", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 88);
      ctx.fillText("to start", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 88);
    }

    // Death overlay
    if (state === "dead") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = "white";
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 3;
      ctx.font = "bold 36px sans-serif";
      ctx.textAlign = "center";
      ctx.strokeText("Game Over", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.fillText("Game Over", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.font = "bold 18px sans-serif";
      ctx.strokeText("Click or Press Space to retry", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.fillText("Click or Press Space to retry", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [checkCollision, drawBackground, drawBird, drawGround, drawPipe]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [gameLoop]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [jump]);

  return { canvasRef, gameState, score, bestScore, jump };
}

export function FlappyBirdGame() {
  const { canvasRef, score, bestScore, jump } = useFlappyBird();

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-3xl font-bold">Flappy Bird</h1>

      <div className="flex gap-8 text-sm text-zinc-500 dark:text-zinc-400">
        <div className="text-center">
          <p className="font-medium">Score</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{score}</p>
        </div>
        <div className="text-center">
          <p className="font-medium">Best</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{bestScore}</p>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={jump}
        className="rounded-lg border-2 border-zinc-300 dark:border-zinc-600 cursor-pointer"
        style={{ imageRendering: "auto" }}
      />

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Press Space, Up Arrow, or click to flap
      </p>
    </div>
  );
}
