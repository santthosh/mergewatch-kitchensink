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
  { name: "Tetris", href: "/games/tetris", emoji: "🧱" },
  { name: "Breakout", href: "/games/breakout", emoji: "🏓" },
  { name: "Sudoku", href: "/games/sudoku", emoji: "9️⃣" },
  { name: "Chess", href: "/games/chess", emoji: "♟️" },
  { name: "Checkers", href: "/games/checkers", emoji: "🔴" },
  { name: "Connect Four", href: "/games/connect-four", emoji: "🟡" },
  { name: "Hangman", href: "/games/hangman", emoji: "💀" },
  { name: "Wordle", href: "/games/wordle", emoji: "📝" },
  { name: "Flappy Bird", href: "/games/flappy-bird", emoji: "🐦" },
  { name: "Pong", href: "/games/pong", emoji: "🏐" },
  { name: "Simon Says", href: "/games/simon-says", emoji: "🎵" },
  { name: "Whack-a-Mole", href: "/games/whack-a-mole", emoji: "🔨" },
];

export const gamesBySlug: Record<string, Game> = Object.fromEntries(
  games.map((game) => {
    const slug = game.href.replace("/games/", "");
    return [slug, game];
  })
);
