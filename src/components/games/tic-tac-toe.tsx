"use client";

import { useState, useCallback, useEffect } from "react";

type Cell = "X" | "O" | null;
type Difficulty = "easy" | "medium" | "hard";

const winPatterns = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWinner(board: Cell[]): Cell {
  for (const [a, b, c] of winPatterns) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function getWinningLine(board: Cell[]): number[] | null {
  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return pattern;
    }
  }
  return null;
}

function getEmptyCells(board: Cell[]): number[] {
  return board.reduce<number[]>((acc, cell, i) => {
    if (!cell) acc.push(i);
    return acc;
  }, []);
}

function minimax(board: Cell[], isMaximizing: boolean): number {
  const winner = checkWinner(board);
  if (winner === "O") return 10;
  if (winner === "X") return -10;
  if (getEmptyCells(board).length === 0) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (const i of getEmptyCells(board)) {
      board[i] = "O";
      best = Math.max(best, minimax(board, false));
      board[i] = null;
    }
    return best;
  } else {
    let best = Infinity;
    for (const i of getEmptyCells(board)) {
      board[i] = "X";
      best = Math.min(best, minimax(board, true));
      board[i] = null;
    }
    return best;
  }
}

function getBestMove(board: Cell[]): number {
  let bestScore = -Infinity;
  let bestMove = -1;
  for (const i of getEmptyCells(board)) {
    board[i] = "O";
    const score = minimax(board, false);
    board[i] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }
  return bestMove;
}

function getComputerMove(board: Cell[], difficulty: Difficulty): number {
  const empty = getEmptyCells(board);
  if (empty.length === 0) return -1;

  if (difficulty === "easy") {
    return empty[Math.floor(Math.random() * empty.length)];
  }

  if (difficulty === "medium") {
    // 50% chance of optimal move
    if (Math.random() < 0.5) {
      return getBestMove([...board]);
    }
    return empty[Math.floor(Math.random() * empty.length)];
  }

  // hard: always optimal
  return getBestMove([...board]);
}

const speedLabels: Record<number, string> = {
  200: "Fast",
  500: "Normal",
  1000: "Slow",
  2000: "Very Slow",
};

export function TicTacToeGame() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [speed, setSpeed] = useState(500);
  const [score, setScore] = useState({ player: 0, computer: 0, draws: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [thinking, setThinking] = useState(false);

  const winner = checkWinner(board);
  const winningLine = getWinningLine(board);
  const isDraw = !winner && getEmptyCells(board).length === 0;

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setGameOver(false);
    setThinking(false);
  }, []);

  // Handle game over
  useEffect(() => {
    if (gameOver) return;
    if (winner === "X") {
      setScore((s) => ({ ...s, player: s.player + 1 }));
      setGameOver(true);
    } else if (winner === "O") {
      setScore((s) => ({ ...s, computer: s.computer + 1 }));
      setGameOver(true);
    } else if (isDraw) {
      setScore((s) => ({ ...s, draws: s.draws + 1 }));
      setGameOver(true);
    }
  }, [winner, isDraw, gameOver]);

  // Computer move
  useEffect(() => {
    if (isPlayerTurn || gameOver || winner || isDraw) return;

    setThinking(true);
    const timeout = setTimeout(() => {
      setBoard((prev) => {
        const move = getComputerMove(prev, difficulty);
        if (move === -1) return prev;
        const next = [...prev];
        next[move] = "O";
        return next;
      });
      setIsPlayerTurn(true);
      setThinking(false);
    }, speed);

    return () => clearTimeout(timeout);
  }, [isPlayerTurn, gameOver, winner, isDraw, difficulty, speed]);

  function handleCellClick(index: number) {
    if (!isPlayerTurn || board[index] || winner || isDraw || thinking) return;

    const next = [...board];
    next[index] = "X";
    setBoard(next);
    setIsPlayerTurn(false);
  }

  function getStatus() {
    if (winner === "X") return "You win!";
    if (winner === "O") return "Computer wins!";
    if (isDraw) return "It's a draw!";
    if (thinking) return "Computer is thinking...";
    return "Your turn (X)";
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold">Tic Tac Toe</h1>

      {/* Settings */}
      <div className="flex flex-wrap gap-6 items-center justify-center text-sm">
        <div className="flex items-center gap-2">
          <label className="font-medium text-zinc-600 dark:text-zinc-400">
            Difficulty:
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm"
            disabled={!gameOver && board.some(Boolean)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="font-medium text-zinc-600 dark:text-zinc-400">
            Speed:
          </label>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm"
          >
            {Object.entries(speedLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status */}
      <p
        className={`text-lg font-medium ${
          winner === "X"
            ? "text-green-600 dark:text-green-400"
            : winner === "O"
              ? "text-red-600 dark:text-red-400"
              : isDraw
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-zinc-600 dark:text-zinc-400"
        }`}
      >
        {getStatus()}
      </p>

      {/* Board */}
      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleCellClick(i)}
            disabled={!isPlayerTurn || !!cell || !!winner || isDraw || thinking}
            className={`w-24 h-24 rounded-lg text-3xl font-bold transition-all
              ${
                !cell && isPlayerTurn && !winner && !isDraw && !thinking
                  ? "hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                  : ""
              }
              ${
                winningLine?.includes(i)
                  ? "bg-green-100 dark:bg-green-900/30 border-2 border-green-500"
                  : "bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700"
              }
              ${cell === "X" ? "text-blue-600 dark:text-blue-400" : ""}
              ${cell === "O" ? "text-red-600 dark:text-red-400" : ""}
            `}
          >
            {cell}
          </button>
        ))}
      </div>

      {/* Play again */}
      {gameOver && (
        <button
          onClick={resetGame}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
        >
          Play Again
        </button>
      )}

      {/* Scoreboard */}
      <div className="flex gap-8 text-sm text-zinc-500 dark:text-zinc-400">
        <div className="text-center">
          <p className="font-medium text-blue-600 dark:text-blue-400">You (X)</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {score.player}
          </p>
        </div>
        <div className="text-center">
          <p className="font-medium">Draws</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {score.draws}
          </p>
        </div>
        <div className="text-center">
          <p className="font-medium text-red-600 dark:text-red-400">CPU (O)</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {score.computer}
          </p>
        </div>
      </div>
    </div>
  );
}
