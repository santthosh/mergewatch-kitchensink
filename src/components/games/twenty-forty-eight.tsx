"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type Board = number[][];
type Direction = "up" | "down" | "left" | "right";

const GRID_SIZE = 4;

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: "bg-zinc-200 dark:bg-zinc-700", text: "" },
  2: { bg: "bg-zinc-100 dark:bg-zinc-600", text: "text-zinc-900 dark:text-zinc-100" },
  4: { bg: "bg-zinc-200 dark:bg-zinc-500", text: "text-zinc-900 dark:text-zinc-100" },
  8: { bg: "bg-orange-300 dark:bg-orange-700", text: "text-white" },
  16: { bg: "bg-orange-400 dark:bg-orange-600", text: "text-white" },
  32: { bg: "bg-orange-500 dark:bg-orange-500", text: "text-white" },
  64: { bg: "bg-red-500 dark:bg-red-600", text: "text-white" },
  128: { bg: "bg-yellow-400 dark:bg-yellow-500", text: "text-white" },
  256: { bg: "bg-yellow-400 dark:bg-yellow-400", text: "text-white" },
  512: { bg: "bg-yellow-500 dark:bg-yellow-300", text: "text-white dark:text-zinc-900" },
  1024: { bg: "bg-yellow-500 dark:bg-yellow-300", text: "text-white dark:text-zinc-900" },
  2048: { bg: "bg-yellow-600 dark:bg-yellow-200", text: "text-white dark:text-zinc-900" },
};

function getColors(value: number): { bg: string; text: string } {
  return TILE_COLORS[value] ?? { bg: "bg-purple-600 dark:bg-purple-400", text: "text-white" };
}

function createEmptyBoard(): Board {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

function getEmptyCells(board: Board): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (board[r][c] === 0) cells.push([r, c]);
    }
  }
  return cells;
}

function addRandomTile(board: Board): Board {
  const empty = getEmptyCells(board);
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const newBoard = board.map((row) => [...row]);
  newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newBoard;
}

function initBoard(): Board {
  let board = createEmptyBoard();
  board = addRandomTile(board);
  board = addRandomTile(board);
  return board;
}

function slideRow(row: number[]): { newRow: number[]; score: number } {
  // Remove zeros
  const filtered = row.filter((v) => v !== 0);
  let score = 0;
  const merged: number[] = [];

  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const val = filtered[i] * 2;
      merged.push(val);
      score += val;
      i += 2;
    } else {
      merged.push(filtered[i]);
      i += 1;
    }
  }

  // Pad with zeros
  while (merged.length < GRID_SIZE) {
    merged.push(0);
  }

  return { newRow: merged, score };
}

function rotateBoard(board: Board): Board {
  const n = GRID_SIZE;
  const rotated = createEmptyBoard();
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      rotated[c][n - 1 - r] = board[r][c];
    }
  }
  return rotated;
}

function move(board: Board, direction: Direction): { newBoard: Board; score: number; moved: boolean } {
  let rotated = board.map((row) => [...row]);
  let rotations = 0;

  switch (direction) {
    case "left": rotations = 0; break;
    case "down": rotations = 1; break;
    case "right": rotations = 2; break;
    case "up": rotations = 3; break;
  }

  for (let i = 0; i < rotations; i++) {
    rotated = rotateBoard(rotated);
  }

  let totalScore = 0;
  const result = rotated.map((row) => {
    const { newRow, score } = slideRow(row);
    totalScore += score;
    return newRow;
  });

  // Rotate back
  let final = result;
  for (let i = 0; i < (4 - rotations) % 4; i++) {
    final = rotateBoard(final);
  }

  const moved = board.some((row, r) => row.some((val, c) => val !== final[r][c]));

  return { newBoard: final, score: totalScore, moved };
}

function canMove(board: Board): boolean {
  // Check for empty cells
  if (getEmptyCells(board).length > 0) return true;

  // Check for adjacent same values
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const val = board[r][c];
      if (c + 1 < GRID_SIZE && board[r][c + 1] === val) return true;
      if (r + 1 < GRID_SIZE && board[r + 1][c] === val) return true;
    }
  }
  return false;
}

function hasWon(board: Board): boolean {
  return board.some((row) => row.some((val) => val >= 2048));
}

function getFontSize(value: number): string {
  if (value >= 1024) return "text-lg sm:text-xl";
  if (value >= 128) return "text-xl sm:text-2xl";
  return "text-2xl sm:text-3xl";
}

export function TwentyFortyEightGame() {
  const [board, setBoard] = useState<Board>(() => initBoard());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  const [keepPlaying, setKeepPlaying] = useState(false);
  const processingRef = useRef(false);

  const handleMove = useCallback((direction: Direction) => {
    if (processingRef.current) return;
    if (gameState === "lost") return;
    if (gameState === "won" && !keepPlaying) return;

    processingRef.current = true;

    setBoard((prevBoard) => {
      const { newBoard, score: moveScore, moved } = move(prevBoard, direction);

      if (!moved) {
        processingRef.current = false;
        return prevBoard;
      }

      const withNewTile = addRandomTile(newBoard);

      setScore((prev) => {
        const newScore = prev + moveScore;
        setBestScore((best) => Math.max(best, newScore));
        return newScore;
      });

      if (!keepPlaying && hasWon(withNewTile)) {
        setGameState("won");
      } else if (!canMove(withNewTile)) {
        setGameState("lost");
      }

      processingRef.current = false;
      return withNewTile;
    });
  }, [gameState, keepPlaying]);

  const resetGame = useCallback(() => {
    setBoard(initBoard());
    setScore(0);
    setGameState("playing");
    setKeepPlaying(false);
    processingRef.current = false;
  }, []);

  // Keyboard controls
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      let direction: Direction | null = null;
      switch (e.key) {
        case "ArrowUp": case "w": case "W": direction = "up"; break;
        case "ArrowDown": case "s": case "S": direction = "down"; break;
        case "ArrowLeft": case "a": case "A": direction = "left"; break;
        case "ArrowRight": case "d": case "D": direction = "right"; break;
      }
      if (direction) {
        e.preventDefault();
        handleMove(direction);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove]);

  // Touch/swipe controls
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    function handleTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }

    function handleTouchEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const minSwipe = 30;

      if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        handleMove(dx > 0 ? "right" : "left");
      } else {
        handleMove(dy > 0 ? "down" : "up");
      }
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleMove]);

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold">2048</h1>

      {/* Scores */}
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
      </div>

      {/* Board */}
      <div className="relative rounded-lg bg-zinc-300 dark:bg-zinc-600 p-2 sm:p-3">
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {board.flat().map((value, i) => {
            const colors = getColors(value);
            return (
              <div
                key={i}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-md flex items-center justify-center font-bold transition-all ${colors.bg} ${colors.text} ${getFontSize(value)}`}
              >
                {value > 0 ? value : ""}
              </div>
            );
          })}
        </div>

        {/* Game over overlay */}
        {gameState === "lost" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-lg">
            <p className="text-white text-2xl font-bold mb-4">Game Over!</p>
            <button
              onClick={resetGame}
              className="rounded-lg bg-white text-zinc-900 px-6 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Win overlay */}
        {gameState === "won" && !keepPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-yellow-500/70 rounded-lg">
            <p className="text-white text-2xl font-bold mb-4">You reached 2048!</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setKeepPlaying(true);
                  setGameState("playing");
                }}
                className="rounded-lg bg-white text-zinc-900 px-6 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
              >
                Keep Playing
              </button>
              <button
                onClick={resetGame}
                className="rounded-lg bg-zinc-900 text-white px-6 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
              >
                New Game
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Game button */}
      <button
        onClick={resetGame}
        className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
      >
        New Game
      </button>

      {/* Controls hint */}
      <div className="text-xs text-zinc-400 text-center space-y-1">
        <p>Arrow keys or WASD to move tiles</p>
        <p>Swipe on mobile</p>
      </div>
    </div>
  );
}
