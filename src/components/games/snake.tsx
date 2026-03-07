"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Position = { x: number; y: number };
type GameState = "idle" | "playing" | "paused" | "gameover";

const GRID_SIZE = 20;
const CELL_SIZE = 24;

const speedOptions = [
  { label: "Slow", interval: 200 },
  { label: "Normal", interval: 130 },
  { label: "Fast", interval: 80 },
  { label: "Insane", interval: 40 },
];

const oppositeDirection: Record<Direction, Direction> = {
  UP: "DOWN",
  DOWN: "UP",
  LEFT: "RIGHT",
  RIGHT: "LEFT",
};

function randomFood(snake: Position[]): Position {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
}

export function SnakeGame() {
  const initialSnake: Position[] = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];

  const [snake, setSnake] = useState<Position[]>(initialSnake);
  const [food, setFood] = useState<Position>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(1);

  const directionRef = useRef<Direction>(direction);
  const snakeRef = useRef<Position[]>(snake);
  const foodRef = useRef<Position>(food);
  const gameStateRef = useRef<GameState>(gameState);

  directionRef.current = direction;
  snakeRef.current = snake;
  foodRef.current = food;
  gameStateRef.current = gameState;

  const resetGame = useCallback(() => {
    const newSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    setSnake(newSnake);
    setFood(randomFood(newSnake));
    setDirection("RIGHT");
    setScore(0);
    setGameState("playing");
  }, []);

  const tick = useCallback(() => {
    if (gameStateRef.current !== "playing") return;

    const currentSnake = snakeRef.current;
    const currentDirection = directionRef.current;
    const currentFood = foodRef.current;
    const head = currentSnake[0];

    const newHead: Position = { ...head };
    switch (currentDirection) {
      case "UP": newHead.y -= 1; break;
      case "DOWN": newHead.y += 1; break;
      case "LEFT": newHead.x -= 1; break;
      case "RIGHT": newHead.x += 1; break;
    }

    // Wall collision
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      setGameState("gameover");
      setHighScore((prev) => Math.max(prev, score));
      return;
    }

    // Self collision
    if (currentSnake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
      setGameState("gameover");
      setHighScore((prev) => Math.max(prev, score));
      return;
    }

    const newSnake = [newHead, ...currentSnake];
    const ateFood = newHead.x === currentFood.x && newHead.y === currentFood.y;

    if (ateFood) {
      setScore((s) => s + 1);
      setFood(randomFood(newSnake));
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  }, [score]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const interval = setInterval(tick, speedOptions[speedIndex].interval);
    return () => clearInterval(interval);
  }, [gameState, speedIndex, tick]);

  // Keyboard controls
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (gameStateRef.current === "idle") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          resetGame();
          return;
        }
      }

      if (gameStateRef.current === "gameover") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          resetGame();
          return;
        }
      }

      if (gameStateRef.current === "playing" && (e.key === " " || e.key === "Escape")) {
        e.preventDefault();
        setGameState("paused");
        return;
      }

      if (gameStateRef.current === "paused" && (e.key === " " || e.key === "Escape")) {
        e.preventDefault();
        setGameState("playing");
        return;
      }

      if (gameStateRef.current !== "playing") return;

      let newDirection: Direction | null = null;
      switch (e.key) {
        case "ArrowUp": case "w": case "W": newDirection = "UP"; break;
        case "ArrowDown": case "s": case "S": newDirection = "DOWN"; break;
        case "ArrowLeft": case "a": case "A": newDirection = "LEFT"; break;
        case "ArrowRight": case "d": case "D": newDirection = "RIGHT"; break;
      }

      if (newDirection && newDirection !== oppositeDirection[directionRef.current]) {
        e.preventDefault();
        setDirection(newDirection);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resetGame]);

  function getCellColor(x: number, y: number): string {
    if (snake[0].x === x && snake[0].y === y) {
      return "bg-green-500";
    }
    if (snake.some((s) => s.x === x && s.y === y)) {
      return "bg-green-400 dark:bg-green-600";
    }
    if (food.x === x && food.y === y) {
      return "bg-red-500";
    }
    return (x + y) % 2 === 0
      ? "bg-zinc-100 dark:bg-zinc-800"
      : "bg-zinc-50 dark:bg-zinc-850 dark:bg-zinc-900";
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold">Snake</h1>

      {/* Settings */}
      <div className="flex items-center gap-2 text-sm">
        <label className="font-medium text-zinc-600 dark:text-zinc-400">
          Speed:
        </label>
        <select
          value={speedIndex}
          onChange={(e) => setSpeedIndex(Number(e.target.value))}
          className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm"
          disabled={gameState === "playing"}
        >
          {speedOptions.map((opt, i) => (
            <option key={i} value={i}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Score */}
      <div className="flex gap-8 text-sm">
        <div className="text-center">
          <p className="font-medium text-zinc-500 dark:text-zinc-400">Score</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{score}</p>
        </div>
        <div className="text-center">
          <p className="font-medium text-zinc-500 dark:text-zinc-400">High Score</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{highScore}</p>
        </div>
      </div>

      {/* Game board */}
      <div
        className="relative border-2 border-zinc-300 dark:border-zinc-600 rounded-lg overflow-hidden"
        style={{ width: GRID_SIZE * CELL_SIZE, height: GRID_SIZE * CELL_SIZE }}
      >
        {Array.from({ length: GRID_SIZE }).map((_, y) =>
          Array.from({ length: GRID_SIZE }).map((_, x) => (
            <div
              key={`${x}-${y}`}
              className={`absolute ${getCellColor(x, y)}`}
              style={{
                left: x * CELL_SIZE,
                top: y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
              }}
            />
          ))
        )}

        {/* Overlay for idle/paused/gameover */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg">
            <p className="text-white text-2xl font-bold mb-2">
              {gameState === "idle" && "Snake"}
              {gameState === "paused" && "Paused"}
              {gameState === "gameover" && "Game Over"}
            </p>
            {gameState === "gameover" && (
              <p className="text-white/80 text-lg mb-4">Score: {score}</p>
            )}
            <button
              onClick={resetGame}
              className="rounded-lg bg-white text-zinc-900 px-6 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
            >
              {gameState === "idle" ? "Start Game" : "Play Again"}
            </button>
            <p className="text-white/60 text-xs mt-3">
              or press Space / Enter
            </p>
          </div>
        )}
      </div>

      {/* Controls hint */}
      <div className="text-xs text-zinc-400 text-center space-y-1">
        <p>Arrow keys or WASD to move</p>
        <p>Space to pause/resume</p>
      </div>
    </div>
  );
}
