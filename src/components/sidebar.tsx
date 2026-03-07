"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { games } from "@/lib/games";

function navItemClass(isActive: boolean): string {
  if (isActive) {
    return "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--sidebar-active-text)] bg-[var(--sidebar-active)]";
  }
  return "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-[var(--sidebar-hover)] transition-colors";
}

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
      <nav className="flex-1 px-3" aria-label="Games">
        <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Games
        </p>
        <ul className="space-y-1">
          {games.map((game) => (
            <li key={game.href}>
              <Link
                href={game.href}
                className={navItemClass(pathname === game.href)}
              >
                <span>{game.emoji}</span>
                <span>{game.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 text-xs text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
        mergewatch-kitchensink
      </div>
    </aside>
  );
}
