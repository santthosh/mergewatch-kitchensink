export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h1 className="text-4xl font-bold">Game Arcade</h1>
      <p className="text-lg text-zinc-500 dark:text-zinc-400">
        Pick a game from the sidebar to get started.
      </p>
    </div>
  );
}
