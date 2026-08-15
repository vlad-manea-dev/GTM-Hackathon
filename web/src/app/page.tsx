const STAGES = [
  {
    id: "01",
    name: "Transcript ingestion",
    detail:
      "Read the call, match it to the right Deal, write Stage, Next Step, Deal Notes, Last Activity, Call Sentiment and Aspiration back into Notion.",
  },
  {
    id: "02",
    name: "Proposal generation",
    detail:
      "Draft the informal proposal from CRM state plus transcript notes — products wanted, headcount, stated objections, economic buyer.",
  },
  {
    id: "03",
    name: "Personalised game",
    detail:
      "A single-file browser shooter built for one buyer. Targets are the competitors in play. Winning is their own aspiration, realised.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white font-sans text-zinc-900 dark:bg-black dark:text-zinc-100">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-14 px-6 py-24">
        <header className="flex flex-col gap-4">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
            Kota · GTM Hackathon
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Rev Ops Agent
          </h1>
          <p className="max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Sales reps lose hours to CRM admin after every call. This one listens
            to the call, updates the CRM, writes the proposal — and builds the
            buyer a game.
          </p>
        </header>

        <ol className="flex flex-col gap-px overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-800">
          {STAGES.map((stage) => (
            <li
              key={stage.id}
              className="flex gap-5 bg-white p-6 dark:bg-zinc-950"
            >
              <span className="font-mono text-sm text-zinc-400">{stage.id}</span>
              <div className="flex flex-col gap-1.5">
                <h2 className="font-medium">{stage.name}</h2>
                <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {stage.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <p className="font-mono text-xs text-zinc-400">
          Sandbox CRM lives in Notion. All data is fictional.
        </p>
      </main>
    </div>
  );
}
