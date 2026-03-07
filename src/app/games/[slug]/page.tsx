import { notFound } from "next/navigation";
import { games, gamesBySlug } from "@/lib/games";

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

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h1 className="text-3xl font-bold">{game.name}</h1>
      <p className="text-zinc-500 dark:text-zinc-400">Coming soon!</p>
    </div>
  );
}
