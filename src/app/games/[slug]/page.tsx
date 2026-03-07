import { notFound } from "next/navigation";

const games: Record<string, { name: string }> = {
  "tic-tac-toe": { name: "Tic Tac Toe" },
  snake: { name: "Snake" },
  minesweeper: { name: "Minesweeper" },
  "memory-match": { name: "Memory Match" },
  "2048": { name: "2048" },
};

export function generateStaticParams() {
  return Object.keys(games).map((slug) => ({ slug }));
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = games[slug];

  if (!game) {
    notFound();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h1 className="text-3xl font-bold">{game.name}</h1>
      <p className="text-zinc-500 dark:text-zinc-400">Coming soon!</p>
    </div>
  );
}
