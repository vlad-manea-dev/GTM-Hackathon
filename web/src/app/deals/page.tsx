import Link from "next/link";

import { formatEur, listDealsWithActivity } from "@/lib/notion/crm";
import { STAGE_ORDER, stageIndex, stageTone } from "@/lib/stage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pipeline · Rev Ops Agent",
  description: "Every deal in the sandbox CRM, live from Notion.",
};

export default async function DealsPage() {
  const deals = await listDealsWithActivity();

  const sorted = [...deals].sort((a, b) => {
    const byStage = stageIndex(a.stage) - stageIndex(b.stage);
    if (byStage !== 0) return byStage;
    return (b.arr ?? 0) - (a.arr ?? 0);
  });

  const openDeals = deals.filter(
    (d) => d.stage !== "Closed Won" && d.stage !== "Closed Lost",
  );
  const openValue = openDeals.reduce((sum, d) => sum + (d.arr ?? 0), 0);
  const weighted = openDeals.reduce(
    (sum, d) => sum + (d.arr ?? 0) * (d.probability ?? 0),
    0,
  );
  const withActivity = deals.filter((d) => d.touchpointCount > 0).length;

  return (
    <div className="flex flex-1 flex-col bg-white font-sans text-zinc-900 dark:bg-black dark:text-zinc-100">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-4">
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
          >
            ← Rev Ops Agent
          </Link>
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
            Pipeline
          </h1>
          <p className="max-w-xl text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
            Read live from the Notion sandbox CRM. {deals.length} deals,{" "}
            {withActivity} with activity logged against them.
          </p>
        </header>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-zinc-200 sm:grid-cols-4 dark:bg-zinc-800">
          {[
            { label: "Open deals", value: String(openDeals.length) },
            { label: "Open value", value: formatEur(openValue) },
            { label: "Weighted", value: formatEur(Math.round(weighted)) },
            { label: "With activity", value: String(withActivity) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-1 bg-white p-4 dark:bg-black"
            >
              <dt className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                {stat.label}
              </dt>
              <dd className="font-display text-xl tracking-tight">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        <section className="flex flex-col gap-3">
          {STAGE_ORDER.map((stage) => {
            const inStage = sorted.filter((d) => d.stage === stage);
            if (inStage.length === 0) return null;

            return (
              <div key={stage} className="flex flex-col gap-2">
                <div className="flex items-baseline gap-3 pt-4">
                  <h2 className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                    {stage}
                  </h2>
                  <span className="font-mono text-[11px] text-zinc-400">
                    {inStage.length}
                  </span>
                </div>

                <ul className="flex flex-col gap-px overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-800">
                  {inStage.map((deal) => (
                    <li key={deal.pageId}>
                      <Link
                        href={`/deals/${deal.dealId}`}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-white px-4 py-3 transition-colors hover:bg-zinc-50 dark:bg-black dark:hover:bg-zinc-950"
                      >
                        <span className="font-mono text-[11px] text-zinc-400">
                          DEAL-{deal.dealId}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[14px] font-medium">
                          {deal.name}
                        </span>

                        {deal.touchpointCount > 0 && (
                          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                            {deal.touchpointCount} touchpoints
                          </span>
                        )}
                        {deal.collateralCount > 0 && (
                          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                            {deal.collateralCount} collateral
                          </span>
                        )}

                        <span
                          className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${stageTone(deal.stage)}`}
                        >
                          {Math.round((deal.probability ?? 0) * 100)}%
                        </span>
                        <span className="w-24 text-right font-mono text-[12px] tabular-nums text-zinc-600 dark:text-zinc-400">
                          {formatEur(deal.arr)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
