"use client";

import { useState, useCallback, useEffect, useRef } from "react";

type Difficulty = "easy" | "medium" | "hard";

const difficultyConfig: Record<Difficulty, { pairs: number; cols: number }> = {
  easy: { pairs: 6, cols: 4 },
  medium: { pairs: 8, cols: 4 },
  hard: { pairs: 12, cols: 6 },
};

const allEmojis = [
  "🐶", "🐱", "🐸", "🦊", "🐻", "🐼",
  "🦁", "🐮", "🐷", "🐵", "🐔", "🐧",
  "🦄", "🐙", "🦋", "🐢", "🐬", "🦉",
];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createBoard(pairs: number): Card[] {
  const emojis = shuffle(allEmojis).slice(0, pairs);
  const cards = shuffle([...emojis, ...emojis]).map((emoji, i) => ({
    id: i,
    emoji,
    flipped: false,
    matched: false,
  }));
  return cards;
}

export function MemoryMatchGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [cards, setCards] = useState<Card[]>(() =>
    createBoard(difficultyConfig[difficulty].pairs)
  );
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [bestScores, setBestScores] = useState<Record<Difficulty, number | null>>({
    easy: null,
    medium: null,
    hard: null,
  });
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const checking = useRef(false);
  const startTimeRef = useRef<number | null>(null);

  const totalPairs = difficultyConfig[difficulty].pairs;
  const cols = difficultyConfig[difficulty].cols;

  // Timer
  useEffect(() => {
    if (!started || gameOver) return;
    if (!startTimeRef.current) startTimeRef.current = Date.now();
    const start = startTimeRef.current;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [started, gameOver]);

  function checkGameOver(newMatchedPairs: number, currentMoves: number) {
    if (newMatchedPairs === totalPairs && totalPairs > 0) {
      setGameOver(true);
      setBestScores((prev) => {
        const current = prev[difficulty];
        if (current === null || currentMoves < current) {
          return { ...prev, [difficulty]: currentMoves };
        }
        return prev;
      });
    }
  }

  const resetGame = useCallback(
    (diff?: Difficulty) => {
      const d = diff ?? difficulty;
      setCards(createBoard(difficultyConfig[d].pairs));
      setFlippedIds([]);
      setMoves(0);
      setMatchedPairs(0);
      setGameOver(false);
      setStarted(false);
      startTimeRef.current = null;
      setElapsed(0);
      checking.current = false;
    },
    [difficulty]
  );

  function handleCardClick(id: number) {
    if (checking.current || gameOver) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;
    if (flippedIds.includes(id)) return;

    if (!started) setStarted(true);

    const newFlipped = [...flippedIds, id];
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, flipped: true } : c))
    );
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      checking.current = true;

      const [firstId, secondId] = newFlipped;
      const first = cards.find((c) => c.id === firstId)!;
      const second = cards.find((c) => c.id === secondId)!;

      if (first.emoji === second.emoji) {
        const newMoves = moves + 1;
        const newMatchedPairs = matchedPairs + 1;
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, matched: true }
                : c
            )
          );
          setFlippedIds([]);
          setMatchedPairs(newMatchedPairs);
          checkGameOver(newMatchedPairs, newMoves);
          checking.current = false;
        }, 500);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, flipped: false }
                : c
            )
          );
          setFlippedIds([]);
          checking.current = false;
        }, 800);
      }
    }
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold">Memory Match</h1>

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
              resetGame(d);
            }}
            className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm"
          >
            <option value="easy">Easy (6 pairs)</option>
            <option value="medium">Medium (8 pairs)</option>
            <option value="hard">Hard (12 pairs)</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-8 text-sm text-zinc-500 dark:text-zinc-400">
        <div className="text-center">
          <p className="font-medium">Moves</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {moves}
          </p>
        </div>
        <div className="text-center">
          <p className="font-medium">Pairs</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {matchedPairs}/{totalPairs}
          </p>
        </div>
        <div className="text-center">
          <p className="font-medium">Time</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {formatTime(elapsed)}
          </p>
        </div>
      </div>

      {/* Status */}
      {gameOver && (
        <p className="text-lg font-medium text-green-600 dark:text-green-400">
          You matched all pairs in {moves} moves!
        </p>
      )}

      {/* Board */}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.flipped || card.matched || gameOver}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg text-2xl sm:text-3xl font-bold transition-all duration-200
              ${
                card.matched
                  ? "bg-green-100 dark:bg-green-900/30 border-2 border-green-500 scale-95"
                  : card.flipped
                    ? "bg-white dark:bg-zinc-700 border-2 border-blue-400 dark:border-blue-500"
                    : "bg-zinc-200 dark:bg-zinc-800 border-2 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
              }
            `}
          >
            {card.flipped || card.matched ? card.emoji : ""}
          </button>
        ))}
      </div>

      {/* Play again / Reset */}
      <button
        onClick={() => resetGame()}
        className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
      >
        {gameOver ? "Play Again" : "Reset"}
      </button>

      {/* Best scores */}
      {Object.values(bestScores).some((s) => s !== null) && (
        <div className="flex gap-8 text-sm text-zinc-500 dark:text-zinc-400">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) =>
            bestScores[d] !== null ? (
              <div key={d} className="text-center">
                <p className="font-medium capitalize">{d}</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {bestScores[d]} moves
                </p>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
