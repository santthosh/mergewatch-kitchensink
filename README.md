# mergewatch-kitchensink

[![CI](https://github.com/santthosh/mergewatch-kitchensink/actions/workflows/ci.yml/badge.svg)](https://github.com/santthosh/mergewatch-kitchensink/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A kitchen sink repository for testing [MergeWatch](https://github.com/santthosh/mergewatch). Built with Next.js, TypeScript, and Tailwind CSS.

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
└── app/
    ├── favicon.ico
    ├── globals.css
    ├── layout.tsx
    └── page.tsx
```

## CI/CD

This project uses GitHub Actions for continuous integration. The CI workflow runs on every push to `main` and on pull requests, and includes:

- **Lint** — runs ESLint checks
- **Build** — verifies the production build succeeds
- **Matrix testing** — runs across Node.js 20 and 22

## License

This project is licensed under the MIT License.
