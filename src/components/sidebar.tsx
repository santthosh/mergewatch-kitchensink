"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const games = [
  { name: "Tic Tac Toe", href: "/games/tic-tac-toe", emoji: "❌⭕" },
  { name: "Snake", href: "/games/snake", emoji: "🐍" },
  { name: "Minesweeper", href: "/games/minesweeper", emoji: "💣" },
  { name: "Memory Match", href: "/games/memory-match", emoji: "🃏" },
  { name: "2048", href: "/games/2048", emoji: "🔢" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-64 border-r border-zinc-200 dark:border-zinc-800 flex flex-col"
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      <div className="p-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          🎮 Game Arcade
        </Link>
      </div>
      <nav className="flex-1 px-3">
        <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Games
        </p>
        <ul className="space-y-1">
          {games.map((game) => {
            const isActive = pathname === game.href;
            return (
              <li key={game.href}>
                <Link
                  href={game.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-[var(--sidebar-active-text)]"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-[var(--sidebar-hover)]"
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: "var(--sidebar-active)" }
                      : undefined
                  }
                >
                  <span>{game.emoji}</span>
                  <span>{game.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 text-xs text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
        mergewatch-kitchensink
      </div>
    </aside>
  );
}
