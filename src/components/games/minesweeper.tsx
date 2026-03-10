"use client";

import { useState, useCallback } from "react";

type Difficulty = "beginner" | "intermediate" | "expert";

interface CellData {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacentMines: number;
}

const difficulties: Record<Difficulty, { rows: number; cols: number; mines: number; label: string }> = {
  beginner: { rows: 9, cols: 9, mines: 10, label: "Beginner (9×9, 10 mines)" },
  intermediate: { rows: 16, cols: 16, mines: 40, label: "Intermediate (16×16, 40 mines)" },
  expert: { rows: 16, cols: 30, mines: 99, label: "Expert (16×30, 99 mines)" },
};

function createBoard(rows: number, cols: number): CellData[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacentMines: 0,
    }))
  );
}

function placeMines(board: CellData[][], mines: number, safeRow: number, safeCol: number) {
  const rows = board.length;
  const cols = board[0].length;
  let placed = 0;

  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (board[r][c].mine) continue;
    if (Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1) continue;
    board[r][c].mine = true;
    placed++;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) {
            count++;
          }
        }
      }
      board[r][c].adjacentMines = count;
    }
  }
}

function revealCell(board: CellData[][], row: number, col: number) {
  const rows = board.length;
  const cols = board[0].length;
  const cell = board[row][col];
  if (cell.revealed || cell.flagged) return;

  cell.revealed = true;

  if (cell.adjacentMines === 0 && !cell.mine) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          revealCell(board, nr, nc);
        }
      }
    }
  }
}

function countFlags(board: CellData[][]): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.flagged) count++;
    }
  }
  return count;
}

function checkWin(board: CellData[][]): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (!cell.mine && !cell.revealed) return false;
    }
  }
  return true;
}

const numberColors: Record<number, string> = {
  1: "text-blue-600 dark:text-blue-400",
  2: "text-green-600 dark:text-green-400",
  3: "text-red-600 dark:text-red-400",
  4: "text-purple-700 dark:text-purple-400",
  5: "text-amber-700 dark:text-amber-400",
  6: "text-teal-600 dark:text-teal-400",
  7: "text-zinc-800 dark:text-zinc-200",
  8: "text-zinc-500 dark:text-zinc-400",
};

type GameState = "idle" | "playing" | "won" | "lost";

export function MinesweeperGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [board, setBoard] = useState<CellData[][]>(() => {
    const { rows, cols } = difficulties[difficulty];
    return createBoard(rows, cols);
  });
  const [gameState, setGameState] = useState<GameState>("idle");
  const [time, setTime] = useState(0);
  const [timerRef, setTimerRef] = useState<ReturnType<typeof setInterval> | null>(null);

  const config = difficulties[difficulty];

  const startTimer = useCallback(() => {
    const id = setInterval(() => setTime((t) => t + 1), 1000);
    setTimerRef(id);
    return id;
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef) {
      clearInterval(timerRef);
      setTimerRef(null);
    }
  }, [timerRef]);

  const resetGame = useCallback((diff?: Difficulty) => {
    const d = diff || difficulty;
    const { rows, cols } = difficulties[d];
    setBoard(createBoard(rows, cols));
    setGameState("idle");
    setTime(0);
    if (timerRef) {
      clearInterval(timerRef);
      setTimerRef(null);
    }
  }, [difficulty, timerRef]);

  function handleClick(row: number, col: number) {
    if (gameState === "won" || gameState === "lost") return;
    const cell = board[row][col];
    if (cell.flagged || cell.revealed) return;

    const newBoard = board.map((r) => r.map((c) => ({ ...c })));

    if (gameState === "idle") {
      placeMines(newBoard, config.mines, row, col);
      setGameState("playing");
      startTimer();
    }

    if (newBoard[row][col].mine) {
      // Reveal all mines
      for (const r of newBoard) {
        for (const c of r) {
          if (c.mine) c.revealed = true;
        }
      }
      setBoard(newBoard);
      setGameState("lost");
      stopTimer();
      return;
    }

    revealCell(newBoard, row, col);
    setBoard(newBoard);

    if (checkWin(newBoard)) {
      setGameState("won");
      stopTimer();
    }
  }

  function handleRightClick(e: React.MouseEvent, row: number, col: number) {
    e.preventDefault();
    if (gameState === "won" || gameState === "lost") return;
    const cell = board[row][col];
    if (cell.revealed) return;

    const newBoard = board.map((r) => r.map((c) => ({ ...c })));
    newBoard[row][col].flagged = !newBoard[row][col].flagged;
    setBoard(newBoard);
  }

  function handleDifficultyChange(d: Difficulty) {
    setDifficulty(d);
    resetGame(d);
  }

  const flagCount = countFlags(board);
  const minesRemaining = config.mines - flagCount;

  const cellSize = difficulty === "expert" ? "w-7 h-7 text-xs" : "w-8 h-8 text-sm";

  return (
    <div className="flex flex-col items-center gap-5">
      <h1 className="text-3xl font-bold">Minesweeper</h1>

      {/* Difficulty */}
      <div className="flex items-center gap-2 text-sm">
        <label className="font-medium text-zinc-600 dark:text-zinc-400">Difficulty:</label>
        <select
          value={difficulty}
          onChange={(e) => handleDifficultyChange(e.target.value as Difficulty)}
          className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm"
        >
          {Object.entries(difficulties).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-1.5 font-mono text-lg font-bold text-red-600 dark:text-red-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-md border border-zinc-200 dark:border-zinc-700">
          <span>💣</span> {minesRemaining}
        </div>
        <button
          onClick={() => resetGame()}
          className="text-2xl hover:scale-110 transition-transform cursor-pointer"
          title="New Game"
        >
          {gameState === "won" ? "😎" : gameState === "lost" ? "😵" : "🙂"}
        </button>
        <div className="flex items-center gap-1.5 font-mono text-lg font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-md border border-zinc-200 dark:border-zinc-700">
          <span>⏱</span> {time}
        </div>
      </div>

      {/* Game state message */}
      {gameState === "won" && (
        <p className="text-lg font-medium text-green-600 dark:text-green-400">
          You won! 🎉
        </p>
      )}
      {gameState === "lost" && (
        <p className="text-lg font-medium text-red-600 dark:text-red-400">
          Game over! 💥
        </p>
      )}
      {gameState === "idle" && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Click any cell to start. Right-click to flag.
        </p>
      )}

      {/* Board */}
      <div
        className="inline-grid gap-px bg-zinc-300 dark:bg-zinc-600 border-2 border-zinc-400 dark:border-zinc-500 rounded"
        style={{ gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))` }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            let content = "";
            let cellClasses = `${cellSize} flex items-center justify-center font-bold select-none transition-colors `;

            if (cell.revealed) {
              if (cell.mine) {
                content = "💣";
                cellClasses += "bg-red-200 dark:bg-red-900/50";
              } else {
                cellClasses += "bg-zinc-100 dark:bg-zinc-800";
                if (cell.adjacentMines > 0) {
                  content = String(cell.adjacentMines);
                  cellClasses += ` ${numberColors[cell.adjacentMines] || ""}`;
                }
              }
            } else if (cell.flagged) {
              content = "🚩";
              cellClasses += "bg-zinc-200 dark:bg-zinc-700 cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-600";
            } else {
              cellClasses += "bg-zinc-200 dark:bg-zinc-700 cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-600";
            }

            return (
              <button
                key={`${r}-${c}`}
                className={cellClasses}
                onClick={() => handleClick(r, c)}
                onContextMenu={(e) => handleRightClick(e, r, c)}
              >
                {content}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
