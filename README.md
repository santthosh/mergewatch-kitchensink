# mergewatch-kitchensink

[![CI](https://github.com/santthosh/mergewatch-kitchensink/actions/workflows/ci.yml/badge.svg)](https://github.com/santthosh/mergewatch-kitchensink/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A collection of browser-based games built with Next.js, TypeScript, and Tailwind CSS. This repository serves as a testing ground for [MergeWatch](https://mergewatch.ai) — an AI-powered code review tool for GitHub pull requests.

## Games

| Game | Status | Description |
|------|--------|-------------|
| Tic Tac Toe | Playable | Classic 3x3 grid with AI opponent, three difficulty levels |
| Minesweeper | Playable | Grid-based mine sweeper with flagging and flood fill |
| Memory Match | Playable | Card-matching game with three difficulty levels and timer |
| Sudoku | Playable | Puzzle generator with solver, notes mode, and conflict highlighting |
| Snake | PR Open | Arrow keys / WASD, configurable speed, score tracking |
| Breakout | PR Open | Canvas-based brick breaker with ball physics |
| 2048 | Coming Soon | |
| Tetris | Coming Soon | |
| Chess | Coming Soon | |
| Checkers | Coming Soon | |
| Connect Four | Coming Soon | |
| Hangman | Coming Soon | |
| Wordle | Coming Soon | |
| Flappy Bird | Coming Soon | |
| Pong | Coming Soon | |
| Simon Says | Coming Soon | |
| Whack-a-Mole | Coming Soon | |

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Linting:** [ESLint](https://eslint.org/) with [eslint-config-next](https://nextjs.org/docs/app/api-reference/config/eslint)

## Getting Started

### Prerequisites

- Node.js 20.9.0 or later
- npm

### Installation

```bash
git clone https://github.com/santthosh/mergewatch-kitchensink.git
cd mergewatch-kitchensink
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── app/
│   ├── games/[slug]/page.tsx   # Dynamic game routing
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── games/                  # Game implementations
│       ├── tic-tac-toe.tsx
│       ├── minesweeper.tsx
│       ├── memory-match.tsx
│       └── sudoku.tsx
└── lib/
    └── games.ts                # Game registry
```

### Adding a New Game

1. Create a component in `src/components/games/your-game.tsx` (use `"use client"` directive)
2. Register it in `src/app/games/[slug]/page.tsx` by importing and adding to `gameComponents`
3. The game is already listed in `src/lib/games.ts` if it's one of the planned games — otherwise add an entry there too

## CI/CD

This project uses GitHub Actions for continuous integration. The CI workflow runs on every push to `main` and on pull requests, and includes:

- **Lint** — runs ESLint checks
- **Build** — verifies the production build succeeds
- **Matrix testing** — runs across Node.js 20 and 22

## Contributing

Contributions are welcome! Pick a game from the "Coming Soon" list, create a branch, and open a PR. Each game should:

- Be a self-contained client component
- Support keyboard controls where applicable
- Include difficulty settings
- Follow the existing styling patterns (Tailwind CSS, dark mode support)

## License

This project is licensed under the MIT License.
