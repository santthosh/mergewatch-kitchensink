export interface Game {
  name: string;
  href: string;
  emoji: string;
}

export const games: Game[] = [
  { name: "Tic Tac Toe", href: "/games/tic-tac-toe", emoji: "⭕" },
  { name: "Snake", href: "/games/snake", emoji: "🐍" },
  { name: "Minesweeper", href: "/games/minesweeper", emoji: "💣" },
  { name: "Memory Match", href: "/games/memory-match", emoji: "🃏" },
  { name: "2048", href: "/games/2048", emoji: "🔢" },
];

export const gamesBySlug: Record<string, Game> = Object.fromEntries(
  games.map((game) => {
    const slug = game.href.replace("/games/", "");
    return [slug, game];
  })
);
