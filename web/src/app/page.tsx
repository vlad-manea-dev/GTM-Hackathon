import { WorkflowCanvas } from "@/components/workflow-canvas";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white font-sans text-zinc-900 dark:bg-black dark:text-zinc-100">
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-16 px-6 py-20">
        <header className="flex flex-col gap-4">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
            Kota · GTM Hackathon
          </p>
          <h1 className="font-display text-4xl tracking-tight text-balance sm:text-5xl">
            Rev Ops Agent
          </h1>
          <p className="max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Sales reps lose hours to CRM admin after every call. This one listens
            to the call, updates the CRM, writes the proposal — and builds the
            buyer a game.
          </p>
        </header>

        <WorkflowCanvas />

        <p className="font-mono text-xs text-zinc-400">
          Sandbox CRM lives in Notion. All data is fictional.
        </p>
      </main>
    </div>
  );
}
