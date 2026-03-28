"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type Difficulty = "easy" | "medium" | "hard";
type Board = (number | null)[][];

const difficultyConfig: Record<Difficulty, number> = {
  easy: 38,
  medium: 30,
  hard: 24,
};

function createEmptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(null));
}

function isValidPlacement(board: Board, row: number, col: number, num: number): boolean {
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false;
  }
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}

function solveSudoku(board: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === null) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of nums) {
          if (isValidPlacement(board, r, c, num)) {
            board[r][c] = num;
            if (solveSudoku(board)) return true;
            board[r][c] = null;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generatePuzzle(clues: number): { puzzle: Board; solution: Board } {
  const solution = createEmptyBoard();
  const maxAttempts = 10;
  let solved = false;
  for (let i = 0; i < maxAttempts; i++) {
    // Reset board for each attempt
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        solution[r][c] = null;
      }
    }
    if (solveSudoku(solution)) {
      solved = true;
      break;
    }
  }
  if (!solved) {
    // Fallback: use a known valid Sudoku solution
    const fallback = [
      [5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8],[1,9,8,3,4,2,5,6,7],
      [8,5,9,7,6,1,4,2,3],[4,2,6,8,5,3,7,9,1],[7,1,3,9,2,4,8,5,6],
      [9,6,1,5,3,7,2,8,4],[2,8,7,4,1,9,6,3,5],[3,4,5,2,8,6,1,7,9],
    ];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        solution[r][c] = fallback[r][c];
      }
    }
  }

  const puzzle = solution.map((row) => [...row]);
  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number])
  );

  let remaining = 81;
  for (const [r, c] of positions) {
    if (remaining <= clues) break;
    puzzle[r][c] = null;
    remaining--;
  }

  return { puzzle, solution };
}

function boardsMatch(board: Board, solution: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

function hasConflict(board: Board, row: number, col: number): boolean {
  const val = board[row][col];
  if (val === null) return false;

  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c] === val) return true;
  }
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col] === val) return true;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (r !== row && c !== col && board[r][c] === val) return true;
    }
  }
  return false;
}

export function SudokuGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [puzzleData] = useState(() => generatePuzzle(difficultyConfig["medium"]));
  const [initial, setInitial] = useState<Board>(() => puzzleData.puzzle.map((row) => [...row]));
  const [board, setBoard] = useState<Board>(() => puzzleData.puzzle.map((row) => [...row]));
  const [solution, setSolution] = useState<Board>(puzzleData.solution);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [gameState, setGameState] = useState<"playing" | "won">("playing");
  const [startTime, setStartTime] = useState<number>(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [notesMode, setNotesMode] = useState(false);
  const [notes, setNotes] = useState<Set<number>[][]>(
    Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set<number>()))
  );

  const selectedCellRef = useRef(selectedCell);
  const gameStateRef = useRef(gameState);
  const initialRef = useRef(initial);
  const boardRef = useRef(board);
  const solutionRef = useRef(solution);
  const notesModeRef = useRef(notesMode);

  useEffect(() => {
    selectedCellRef.current = selectedCell;
    gameStateRef.current = gameState;
    initialRef.current = initial;
    boardRef.current = board;
    solutionRef.current = solution;
    notesModeRef.current = notesMode;
  });

  const initGame = useCallback((diff?: Difficulty) => {
    const d = diff ?? difficulty;
    const { puzzle, solution: sol } = generatePuzzle(difficultyConfig[d]);
    setInitial(puzzle.map((row) => [...row]));
    setBoard(puzzle.map((row) => [...row]));
    setSolution(sol);
    setSelectedCell(null);
    setGameState("playing");
    setStartTime(Date.now());
    setElapsed(0);
    setNotesMode(false);
    setNotes(
      Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set<number>()))
    );
  }, [difficulty]);

  // Timer
  useEffect(() => {
    if (gameState !== "playing") return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, gameState]);

  function handleCellClick(row: number, col: number) {
    if (gameState !== "playing") return;
    setSelectedCell([row, col]);
  }

  function handleNumberInput(num: number) {
    if (!selectedCell || gameState !== "playing") return;
    const [row, col] = selectedCell;
    if (initial[row][col] !== null) return;

    if (notesMode) {
      setNotes((prev) => {
        const next = prev.map((r) => r.map((s) => new Set(s)));
        if (next[row][col].has(num)) {
          next[row][col].delete(num);
        } else {
          next[row][col].add(num);
        }
        return next;
      });
      return;
    }

    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = num;
    setBoard(newBoard);

    // Clear notes for this cell
    setNotes((prev) => {
      const next = prev.map((r) => r.map((s) => new Set(s)));
      next[row][col].clear();
      return next;
    });

    if (boardsMatch(newBoard, solution)) {
      setGameState("won");
    }
  }

  function handleClear() {
    if (!selectedCell || gameState !== "playing") return;
    const [row, col] = selectedCell;
    if (initial[row][col] !== null) return;

    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = null;
    setBoard(newBoard);

    setNotes((prev) => {
      const next = prev.map((r) => r.map((s) => new Set(s)));
      next[row][col].clear();
      return next;
    });
  }

  // Keyboard controls
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (gameStateRef.current !== "playing") return;
      const cell = selectedCellRef.current;

      if (e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const num = parseInt(e.key);
        if (!cell) return;
        const [row, col] = cell;
        if (initialRef.current[row][col] !== null) return;

        if (notesModeRef.current) {
          setNotes((prev) => {
            const next = prev.map((r) => r.map((s) => new Set(s)));
            if (next[row][col].has(num)) {
              next[row][col].delete(num);
            } else {
              next[row][col].add(num);
            }
            return next;
          });
          return;
        }

        setBoard((prev) => {
          const newBoard = prev.map((r) => [...r]);
          newBoard[row][col] = num;
          if (boardsMatch(newBoard, solutionRef.current)) {
            setGameState("won");
          }
          return newBoard;
        });
        setNotes((prev) => {
          const next = prev.map((r) => r.map((s) => new Set(s)));
          next[row][col].clear();
          return next;
        });
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        e.preventDefault();
        if (!cell) return;
        const [row, col] = cell;
        if (initialRef.current[row][col] !== null) return;
        setBoard((prev) => {
          const newBoard = prev.map((r) => [...r]);
          newBoard[row][col] = null;
          return newBoard;
        });
        setNotes((prev) => {
          const next = prev.map((r) => r.map((s) => new Set(s)));
          next[row][col].clear();
          return next;
        });
        return;
      }

      if (e.key === "n" || e.key === "N") {
        setNotesMode((prev) => !prev);
        return;
      }

      if (!cell) return;
      const [row, col] = cell;
      if (e.key === "ArrowUp" && row > 0) setSelectedCell([row - 1, col]);
      if (e.key === "ArrowDown" && row < 8) setSelectedCell([row + 1, col]);
      if (e.key === "ArrowLeft" && col > 0) setSelectedCell([row, col - 1]);
      if (e.key === "ArrowRight" && col < 8) setSelectedCell([row, col + 1]);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function getCellClasses(row: number, col: number): string {
    const isSelected = selectedCell?.[0] === row && selectedCell?.[1] === col;
    const isInitial = initial[row][col] !== null;
    const conflict = board[row][col] !== null && hasConflict(board, row, col);
    const sameValue =
      selectedCell &&
      board[selectedCell[0]][selectedCell[1]] !== null &&
      board[row][col] === board[selectedCell[0]][selectedCell[1]];
    const sameRowCol =
      selectedCell &&
      (selectedCell[0] === row || selectedCell[1] === col);
    const sameBox =
      selectedCell &&
      Math.floor(selectedCell[0] / 3) === Math.floor(row / 3) &&
      Math.floor(selectedCell[1] / 3) === Math.floor(col / 3);

    let classes = "w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-xl font-medium transition-colors cursor-pointer select-none ";

    // Borders for 3x3 boxes
    if (col % 3 === 0 && col > 0) classes += "border-l-2 border-l-zinc-400 dark:border-l-zinc-500 ";
    if (row % 3 === 0 && row > 0) classes += "border-t-2 border-t-zinc-400 dark:border-t-zinc-500 ";

    if (isSelected) {
      classes += "bg-blue-200 dark:bg-blue-800 ";
    } else if (sameValue) {
      classes += "bg-blue-100 dark:bg-blue-900/40 ";
    } else if (sameRowCol || sameBox) {
      classes += "bg-zinc-100 dark:bg-zinc-700/50 ";
    } else {
      classes += "bg-white dark:bg-zinc-800 ";
    }

    if (conflict) {
      classes += "text-red-600 dark:text-red-400 ";
    } else if (isInitial) {
      classes += "text-zinc-900 dark:text-zinc-100 font-bold ";
    } else {
      classes += "text-blue-600 dark:text-blue-400 ";
    }

    return classes;
  }

  const filledCount = board.flat().filter((v) => v !== null).length;

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold">Sudoku</h1>

      {/* Settings */}
      <div className="flex flex-wrap gap-6 items-center justify-center text-sm">
        <div className="flex items-center gap-2">
          <label className="font-medium text-zinc-600 dark:text-zinc-400">
            Difficulty:
          </label>
          <select
            value={difficulty}
            onChange={(e) => {
              const d = e.target.value as Difficulty;
              setDifficulty(d);
              initGame(d);
            }}
            className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <button
          onClick={() => setNotesMode((p) => !p)}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            notesMode
              ? "border-blue-500 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
              : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Notes {notesMode ? "ON" : "OFF"}
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-8 text-sm text-zinc-500 dark:text-zinc-400">
        <div className="text-center">
          <p className="font-medium">Time</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {formatTime(elapsed)}
          </p>
        </div>
        <div className="text-center">
          <p className="font-medium">Filled</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {filledCount}/81
          </p>
        </div>
      </div>

      {/* Win message */}
      {gameState === "won" && (
        <p className="text-lg font-medium text-green-600 dark:text-green-400">
          Puzzle solved in {formatTime(elapsed)}!
        </p>
      )}

      {/* Board */}
      <div className="border-2 border-zinc-400 dark:border-zinc-500 rounded-lg overflow-hidden">
        <div className="grid grid-cols-9 divide-x divide-y divide-zinc-200 dark:divide-zinc-700">
          {Array.from({ length: 9 }).map((_, row) =>
            Array.from({ length: 9 }).map((_, col) => (
              <div
                key={`${row}-${col}`}
                onClick={() => handleCellClick(row, col)}
                className={getCellClasses(row, col)}
              >
                {board[row][col] !== null ? (
                  board[row][col]
                ) : notes[row][col].size > 0 ? (
                  <div className="grid grid-cols-3 gap-0 w-full h-full p-0.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <span
                        key={n}
                        className="text-[8px] sm:text-[9px] leading-none flex items-center justify-center text-zinc-400 dark:text-zinc-500"
                      >
                        {notes[row][col].has(n) ? n : ""}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Number pad */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberInput(num)}
            disabled={gameState !== "playing"}
            className="w-9 h-10 sm:w-10 sm:h-11 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleClear}
          disabled={gameState !== "playing"}
          className="w-9 h-10 sm:w-10 sm:h-11 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors text-sm"
        >
          X
        </button>
      </div>

      {/* New game */}
      <button
        onClick={() => initGame()}
        className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
      >
        {gameState === "won" ? "Play Again" : "New Game"}
      </button>

      {/* Controls hint */}
      <div className="text-xs text-zinc-400 text-center space-y-1">
        <p>Click a cell, then type 1-9 or use the number pad</p>
        <p>Arrow keys to navigate, N to toggle notes, Delete to clear</p>
      </div>
    </div>
  );
}
