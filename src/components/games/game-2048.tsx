"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const GRID_SIZE = 4;
const WIN_TILE = 2048;
const TILE_2_PROBABILITY = 0.9;
const NEW_TILE_VALUES = [2, 4] as const;
/** Minimum swipe distance in pixels to register as a move */
const MIN_SWIPE_DISTANCE = 30;

type Board = number[][];

function createEmptyBoard(): Board {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

function addRandomTile(board: Board): Board {
  const newBoard = board.map((row) => [...row]);
  const empty: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (newBoard[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return newBoard;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  newBoard[r][c] = Math.random() < TILE_2_PROBABILITY ? NEW_TILE_VALUES[0] : NEW_TILE_VALUES[1];
  return newBoard;
}

function initBoard(): Board {
  return addRandomTile(addRandomTile(createEmptyBoard()));
}

function rotateClockwise(board: Board): Board {
  const result = createEmptyBoard();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      result[c][GRID_SIZE - 1 - r] = board[r][c];
    }
  }
  return result;
}

function slideLeft(board: Board): { board: Board; score: number; moved: boolean } {
  let score = 0;
  let moved = false;
  const newBoard = createEmptyBoard();

  for (let r = 0; r < GRID_SIZE; r++) {
    const row = board[r].filter((v) => v !== 0);
    const merged: number[] = [];

    for (let i = 0; i < row.length; i++) {
      if (i + 1 < row.length && row[i] === row[i + 1]) {
        const val = row[i] * 2;
        merged.push(val);
        score += val;
        i++;
      } else {
        merged.push(row[i]);
      }
    }

    for (let c = 0; c < GRID_SIZE; c++) {
      newBoard[r][c] = merged[c] || 0;
      if (newBoard[r][c] !== board[r][c]) moved = true;
    }
  }

  return { board: newBoard, score, moved };
}

function move(board: Board, direction: "left" | "right" | "up" | "down"): { board: Board; score: number; moved: boolean } {
  let rotated = board;
  const rotations = { left: 0, down: 1, right: 2, up: 3 }[direction];

  for (let i = 0; i < rotations; i++) rotated = rotateClockwise(rotated);

  const result = slideLeft(rotated);

  let final = result.board;
  for (let i = 0; i < (4 - rotations) % 4; i++) final = rotateClockwise(final);

  return { board: final, score: result.score, moved: result.moved };
}

function canMove(board: Board): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] === 0) return true;
      if (c + 1 < GRID_SIZE && board[r][c] === board[r][c + 1]) return true;
      if (r + 1 < GRID_SIZE && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

function hasWon(board: Board): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (cell === WIN_TILE) return true;
    }
  }
  return false;
}

const tileColors: Record<number, { bg: string; text: string }> = {
  0: { bg: "bg-zinc-200 dark:bg-zinc-700", text: "" },
  2: { bg: "bg-amber-50 dark:bg-zinc-600", text: "text-zinc-800 dark:text-zinc-100" },
  4: { bg: "bg-amber-100 dark:bg-zinc-500", text: "text-zinc-800 dark:text-zinc-100" },
  8: { bg: "bg-orange-300 dark:bg-orange-700", text: "text-white" },
  16: { bg: "bg-orange-400 dark:bg-orange-600", text: "text-white" },
  32: { bg: "bg-orange-500 dark:bg-orange-500", text: "text-white" },
  64: { bg: "bg-red-500 dark:bg-red-600", text: "text-white" },
  128: { bg: "bg-yellow-400 dark:bg-yellow-600", text: "text-white" },
  256: { bg: "bg-yellow-400 dark:bg-yellow-500", text: "text-white" },
  512: { bg: "bg-yellow-500 dark:bg-yellow-500", text: "text-white" },
  1024: { bg: "bg-yellow-500 dark:bg-yellow-400", text: "text-white" },
  2048: { bg: "bg-yellow-300 dark:bg-yellow-300", text: "text-zinc-900" },
};

function getTileStyle(value: number) {
  return tileColors[value] || { bg: "bg-zinc-900 dark:bg-zinc-200", text: "text-white dark:text-zinc-900" };
}

function getTileFontSize(value: number): string {
  if (value < 100) return "text-3xl";
  if (value < 1000) return "text-2xl";
  return "text-xl";
}

type GameState = "playing" | "won" | "lost";

export function Game2048() {
  const [board, setBoard] = useState<Board>(initBoard);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [keepPlaying, setKeepPlaying] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleMove = useCallback(
    (direction: "left" | "right" | "up" | "down") => {
      if (gameState === "lost") return;
      if (gameState === "won" && !keepPlaying) return;

      setBoard((prev) => {
        const result = move(prev, direction);
        if (!result.moved) return prev;

        const newBoard = addRandomTile(result.board);
        setScore((prevScore) => {
          const newScore = prevScore + result.score;
          setBestScore((best) => Math.max(best, newScore));
          return newScore;
        });

        if (!keepPlaying && hasWon(newBoard)) {
          setGameState("won");
        } else if (!canMove(newBoard)) {
          setGameState("lost");
        }

        return newBoard;
      });
    },
    [gameState, keepPlaying]
  );

  const resetGame = useCallback(() => {
    setBoard(initBoard());
    setScore(0);
    setGameState("playing");
    setKeepPlaying(false);
  }, []);

  const handleKeepPlaying = useCallback(() => {
    setKeepPlaying(true);
    setGameState("playing");
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const keyMap: Record<string, "left" | "right" | "up" | "down"> = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
      };
      const dir = keyMap[e.key];
      if (dir) {
        e.preventDefault();
        handleMove(dir);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleMove]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      if (Math.abs(dx) < MIN_SWIPE_DISTANCE && Math.abs(dy) < MIN_SWIPE_DISTANCE) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        handleMove(dx > 0 ? "right" : "left");
      } else {
        handleMove(dy > 0 ? "down" : "up");
      }
    },
    [handleMove]
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-3xl font-bold">2048</h1>

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

      <div
        className="relative rounded-lg bg-zinc-300 dark:bg-zinc-600 p-2"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Overlay for win/loss */}
        {gameState === "won" && !keepPlaying && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-yellow-400/80 dark:bg-yellow-500/80">
            <p className="text-3xl font-bold text-zinc-900">You Win!</p>
            <div className="flex gap-2">
              <button
                onClick={handleKeepPlaying}
                className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
              >
                Keep Playing
              </button>
              <button
                onClick={resetGame}
                className="rounded-lg bg-white text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
              >
                New Game
              </button>
            </div>
          </div>
        )}
        {gameState === "lost" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-zinc-900/60">
            <p className="text-3xl font-bold text-white">Game Over</p>
            <button
              onClick={resetGame}
              className="rounded-lg bg-white text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2">
          {board.map((row, r) =>
            row.map((value, c) => {
              const style = getTileStyle(value);
              return (
                <div
                  key={`${r}-${c}`}
                  className={`w-20 h-20 flex items-center justify-center rounded-md font-bold ${getTileFontSize(value)} ${style.bg} ${style.text} transition-all duration-100`}
                >
                  {value > 0 ? value : ""}
                </div>
              );
            })
          )}
        </div>
      </div>

      <button
        onClick={resetGame}
        className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
      >
        New Game
      </button>

      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Use arrow keys or swipe to play
      </p>
    </div>
  );
}
