import { notFound } from "next/navigation";
import { games, gamesBySlug } from "@/lib/games";
import { TicTacToeGame } from "@/components/games/tic-tac-toe";
import { SnakeGame } from "@/components/games/snake";

const gameComponents: Record<string, React.ComponentType> = {
  "tic-tac-toe": TicTacToeGame,
  snake: SnakeGame,
};

export function generateStaticParams() {
  return games.map((game) => ({ slug: game.href.replace("/games/", "") }));
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = slug ? gamesBySlug[slug] : undefined;

  if (!game) {
    notFound();
  }

  const GameComponent = gameComponents[slug];

  if (GameComponent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-8">
        <GameComponent />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h1 className="text-3xl font-bold">{game.name}</h1>
      <p className="text-zinc-500 dark:text-zinc-400">Coming soon!</p>
    </div>
  );
}
