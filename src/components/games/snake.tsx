"use client";

import { useState, useCallback, useEffect, useRef, useSyncExternalStore } from "react";

type Difficulty = "slow" | "normal" | "fast";
type Direction = "up" | "down" | "left" | "right";
type Point = { x: number; y: number };

const BOARD_SIZE = 20;
const BEST_SCORE_KEY = "snake-best-score";
const BEST_SCORE_EVENT = "snake-best-score-update";

const tickMs: Record<Difficulty, number> = {
  slow: 180,
  normal: 110,
  fast: 70,
};

const directionDelta: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const opposite: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const cellCoords: Point[] = (() => {
  const coords: Point[] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      coords.push({ x, y });
    }
  }
  return coords;
})();

function initialSnake(): Point[] {
  const mid = Math.floor(BOARD_SIZE / 2);
  return [
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
    { x: mid - 3, y: mid },
  ];
}

function randomFood(snake: Point[]): Point | null {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  const free: Point[] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  return free[Math.floor(Math.random() * free.length)];
}

function readBestScore(): number {
  const stored = window.localStorage.getItem(BEST_SCORE_KEY);
  if (stored === null) return 0;
  const n = parseInt(stored, 10);
  if (Number.isNaN(n)) {
    console.warn(`Invalid best score in localStorage:`, stored);
    return 0;
  }
  return n;
}

function writeBestScore(score: number) {
  window.localStorage.setItem(BEST_SCORE_KEY, String(score));
  window.dispatchEvent(new Event(BEST_SCORE_EVENT));
}

function subscribeBestScore(callback: () => void) {
  const handler = (e: StorageEvent | Event) => {
    if (e instanceof StorageEvent && e.key !== null && e.key !== BEST_SCORE_KEY) return;
    callback();
  };
  window.addEventListener("storage", handler);
  window.addEventListener(BEST_SCORE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(BEST_SCORE_EVENT, handler);
  };
}

export function SnakeGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [snake, setSnake] = useState<Point[]>(() => initialSnake());
  const [food, setFood] = useState<Point>(() => randomFood(initialSnake()) ?? { x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const bestScore = useSyncExternalStore(
    subscribeBestScore,
    readBestScore,
    () => 0,
  );
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);

  // Refs let the game loop read latest values without restarting on every change
  const directionRef = useRef<Direction>("right");
  const queuedDirectionRef = useRef<Direction | null>(null);
  const foodRef = useRef<Point>(food);

  useEffect(() => {
    foodRef.current = food;
  }, [food]);

  const resetGame = useCallback(() => {
    const fresh = initialSnake();
    setSnake(fresh);
    setFood(randomFood(fresh) ?? { x: 0, y: 0 });
    directionRef.current = "right";
    queuedDirectionRef.current = null;
    setScore(0);
    setGameOver(false);
    setWon(false);
    setPaused(false);
    setStarted(false);
  }, []);

  const tryQueueDirection = useCallback((next: Direction) => {
    if (next === opposite[directionRef.current]) return;
    if (next === directionRef.current) return;
    queuedDirectionRef.current = next;
    if (!started) setStarted(true);
  }, [started]);

  // Keyboard controls
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if (key === " " || key === "p") {
        e.preventDefault();
        if (gameOver || won) return;
        setPaused((p) => !p);
        return;
      }
      let next: Direction | null = null;
      if (key === "arrowup" || key === "w") next = "up";
      else if (key === "arrowdown" || key === "s") next = "down";
      else if (key === "arrowleft" || key === "a") next = "left";
      else if (key === "arrowright" || key === "d") next = "right";
      if (next) {
        e.preventDefault();
        tryQueueDirection(next);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [tryQueueDirection, gameOver, won]);

  // Game loop
  useEffect(() => {
    if (!started || paused || gameOver || won) return;
    const interval = setInterval(() => {
      setSnake((prev) => {
        const queued = queuedDirectionRef.current;
        const dir = queued ?? directionRef.current;
        directionRef.current = dir;
        queuedDirectionRef.current = null;

        const delta = directionDelta[dir];
        const head = prev[0];
        const newHead = { x: head.x + delta.x, y: head.y + delta.y };

        if (
          newHead.x < 0 ||
          newHead.x >= BOARD_SIZE ||
          newHead.y < 0 ||
          newHead.y >= BOARD_SIZE
        ) {
          setGameOver(true);
          return prev;
        }

        const currentFood = foodRef.current;
        const eating = newHead.x === currentFood.x && newHead.y === currentFood.y;
        const body = eating ? prev : prev.slice(0, -1);

        if (body.some((p) => p.x === newHead.x && p.y === newHead.y)) {
          setGameOver(true);
          return prev;
        }

        const newSnake = [newHead, ...body];

        if (eating) {
          setScore((s) => {
            const next = s + 1;
            if (next > readBestScore()) writeBestScore(next);
            return next;
          });
          const nextFood = randomFood(newSnake);
          if (nextFood === null) {
            setWon(true);
          } else {
            setFood(nextFood);
          }
        }

        return newSnake;
      });
    }, tickMs[difficulty]);
    return () => clearInterval(interval);
  }, [difficulty, started, paused, gameOver, won]);

  function handleDifficultyChange(d: Difficulty) {
    setDifficulty(d);
    resetGame();
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold">Snake</h1>

      <div className="flex flex-wrap gap-6 items-center justify-center text-sm">
        <div className="flex items-center gap-2">
          <label className="font-medium text-zinc-600 dark:text-zinc-400">
            Difficulty:
          </label>
          <select
            value={difficulty}
            onChange={(e) => handleDifficultyChange(e.target.value as Difficulty)}
            className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm"
          >
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
        </div>
      </div>

      <div className="flex gap-8 text-sm text-zinc-500 dark:text-zinc-400">
        <div className="text-center">
          <p className="font-medium">Score</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {score}
          </p>
        </div>
        <div className="text-center">
          <p className="font-medium">Best</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {bestScore}
          </p>
        </div>
        <div className="text-center">
          <p className="font-medium">Length</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {snake.length}
          </p>
        </div>
      </div>

      {gameOver && (
        <p className="text-lg font-medium text-red-600 dark:text-red-400">
          Game over! Final score: {score}
        </p>
      )}
      {won && (
        <p className="text-lg font-medium text-green-600 dark:text-green-400">
          You filled the board! Final score: {score}
        </p>
      )}
      {!started && !gameOver && !won && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Use arrow keys or WASD to move. Press space to pause.
        </p>
      )}
      {paused && !gameOver && !won && (
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Paused — press space to resume
        </p>
      )}

      <div
        className="grid bg-zinc-100 dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-700 rounded-lg p-1"
        style={{
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
        }}
      >
        {cellCoords.map(({ x, y }, i) => {
          const isHead = snake[0].x === x && snake[0].y === y;
          const isBody = !isHead && snake.some((p) => p.x === x && p.y === y);
          const isFood = food.x === x && food.y === y && !won;
          return (
            <div
              key={i}
              className={`w-4 h-4 sm:w-5 sm:h-5 rounded-sm m-px ${
                isHead
                  ? "bg-green-600 dark:bg-green-400"
                  : isBody
                    ? "bg-green-500 dark:bg-green-500"
                    : isFood
                      ? "bg-red-500 dark:bg-red-400"
                      : "bg-zinc-200 dark:bg-zinc-800"
              }`}
            />
          );
        })}
      </div>

      <div className="flex gap-3">
        {!gameOver && !won && started && (
          <button
            onClick={() => setPaused((p) => !p)}
            className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-6 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            {paused ? "Resume" : "Pause"}
          </button>
        )}
        <button
          onClick={resetGame}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
        >
          {gameOver || won ? "Play Again" : "Reset"}
        </button>
      </div>
    </div>
  );
}
