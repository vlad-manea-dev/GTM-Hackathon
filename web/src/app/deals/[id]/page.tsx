import Link from "next/link";
import { notFound } from "next/navigation";

import { NotionBlocks } from "@/components/notion-blocks";
import { getBlocks } from "@/lib/notion/client";
import { formatDate, formatEur, getDealDetail } from "@/lib/notion/crm";
import { SENTIMENT_TONE, TYPE_ICON, stageTone } from "@/lib/stage";

export const dynamic = "force-dynamic";

/**
 * One page per deal: the CRM record, who is on it, every touchpoint, and the
 * collateral produced. Document bodies are fetched one at a time via ?doc= —
 * fetching all twelve transcripts on every render would burn the Notion rate
 * limit for content nobody has asked to read yet.
 */
export default async function DealPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ doc?: string }>;
}) {
  const { id } = await params;
  const { doc } = await searchParams;

  const dealId = Number(id);
  if (!Number.isFinite(dealId)) notFound();

  const detail = await getDealDetail(dealId);
  if (!detail) notFound();

  const { deal, company, contacts, touchpoints, collateral } = detail;

  const documents = [
    ...touchpoints.map((t) => ({
      pageId: t.pageId,
      title: t.subject,
      notionUrl: t.notionUrl,
    })),
    ...collateral.map((c) => ({
      pageId: c.pageId,
      title: c.title,
      notionUrl: c.notionUrl,
    })),
  ];

  const openDoc =
    documents.find((d) => d.pageId === doc) ?? documents[0] ?? null;
  const blocks = openDoc ? await getBlocks(openDoc.pageId) : [];

  return (
    <div className="flex flex-1 flex-col bg-white font-sans text-zinc-900 dark:bg-black dark:text-zinc-100">
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-4">
          <Link
            href="/deals"
            className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
          >
            ← Pipeline
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs text-zinc-400">
              DEAL-{deal.dealId}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${stageTone(deal.stage)}`}
            >
              {deal.stage}
            </span>
            <a
              href={deal.notionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 underline underline-offset-2 hover:text-zinc-600"
            >
              Open in Notion
            </a>
          </div>

          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
            {deal.name}
          </h1>

          {deal.notes && (
            <p className="max-w-2xl text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
              {deal.notes}
            </p>
          )}
        </header>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-zinc-200 sm:grid-cols-3 lg:grid-cols-6 dark:bg-zinc-800">
          {[
            { label: "ARR", value: formatEur(deal.arr) },
            {
              label: "Probability",
              value: `${Math.round((deal.probability ?? 0) * 100)}%`,
            },
            {
              label: "Weighted",
              value: formatEur(
                Math.round((deal.arr ?? 0) * (deal.probability ?? 0)),
              ),
            },
            { label: "Employees", value: deal.employees?.toLocaleString() ?? "—" },
            { label: "Close date", value: formatDate(deal.closeDate) },
            { label: "Owner", value: deal.owner ?? "—" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-1 bg-white p-4 dark:bg-black"
            >
              <dt className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                {stat.label}
              </dt>
              <dd className="font-display text-lg tracking-tight">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        {deal.nextStep && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              Next step
            </p>
            <p className="mt-1 text-[15px] leading-7">{deal.nextStep}</p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          {/* Left: who, what was produced, and everything that happened */}
          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-3">
              <h2 className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                People
              </h2>
              <ul className="flex flex-col gap-px overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-800">
                {contacts.map((contact) => (
                  <li
                    key={contact.pageId}
                    className="flex flex-col gap-1 bg-white p-4 dark:bg-black"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[14px] font-medium">
                        {contact.name}
                      </span>
                      {contact.sentiment && (
                        <span
                          className={`font-mono text-[10px] uppercase tracking-wider ${SENTIMENT_TONE[contact.sentiment] ?? ""}`}
                        >
                          {contact.sentiment}
                        </span>
                      )}
                    </div>
                    <span className="text-[12px] text-zinc-500">
                      {contact.jobTitle}
                      {contact.role ? ` · ${contact.role}` : ""}
                    </span>
                    {contact.aspiration && (
                      <p className="mt-1 text-[12px] leading-5 text-zinc-500 italic">
                        “{contact.aspiration}”
                      </p>
                    )}
                  </li>
                ))}
                {contacts.length === 0 && (
                  <li className="bg-white p-4 text-[13px] text-zinc-500 dark:bg-black">
                    No contacts linked.
                  </li>
                )}
              </ul>
            </section>

            {company && (
              <section className="flex flex-col gap-3">
                <h2 className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                  Company
                </h2>
                <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <span className="text-[14px] font-medium">{company.name}</span>
                  <span className="text-[12px] text-zinc-500">
                    {[company.industry, company.hq].filter(Boolean).join(" · ")}
                  </span>
                  {company.employees && (
                    <span className="font-mono text-[11px] text-zinc-500">
                      {company.employees.toLocaleString()} employees
                    </span>
                  )}
                </div>
              </section>
            )}

            <section className="flex flex-col gap-3">
              <h2 className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                Collateral
              </h2>
              <ul className="flex flex-col gap-px overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-800">
                {collateral.map((item) => (
                  <li key={item.pageId}>
                    <Link
                      href={`/deals/${deal.dealId}?doc=${item.pageId}`}
                      className={`flex items-center gap-3 p-3 transition-colors ${
                        openDoc?.pageId === item.pageId
                          ? "bg-zinc-100 dark:bg-zinc-900"
                          : "bg-white hover:bg-zinc-50 dark:bg-black dark:hover:bg-zinc-950"
                      }`}
                    >
                      <span aria-hidden>{TYPE_ICON[item.type ?? ""] ?? "📄"}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">
                          {item.title}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                          {item.type} · {item.status}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
                {collateral.length === 0 && (
                  <li className="bg-white p-4 text-[13px] text-zinc-500 dark:bg-black">
                    Nothing produced yet.
                  </li>
                )}
              </ul>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                Activity
              </h2>
              <ul className="flex flex-col gap-px overflow-hidden rounded-xl bg-zinc-200 dark:bg-zinc-800">
                {touchpoints.map((tp) => (
                  <li key={tp.pageId}>
                    <Link
                      href={`/deals/${deal.dealId}?doc=${tp.pageId}`}
                      className={`flex gap-3 p-3 transition-colors ${
                        openDoc?.pageId === tp.pageId
                          ? "bg-zinc-100 dark:bg-zinc-900"
                          : "bg-white hover:bg-zinc-50 dark:bg-black dark:hover:bg-zinc-950"
                      }`}
                    >
                      <span aria-hidden className="pt-0.5">
                        {TYPE_ICON[tp.type ?? ""] ?? "📄"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[13px] font-medium">
                            {tp.subject}
                          </span>
                          <span className="shrink-0 font-mono text-[10px] text-zinc-400">
                            {formatDate(tp.date)}
                          </span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                          <span>{tp.direction}</span>
                          {tp.durationMin && <span>{tp.durationMin} min</span>}
                          {tp.sentiment && (
                            <span
                              className={SENTIMENT_TONE[tp.sentiment] ?? ""}
                            >
                              {tp.sentiment}
                            </span>
                          )}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
                {touchpoints.length === 0 && (
                  <li className="bg-white p-4 text-[13px] text-zinc-500 dark:bg-black">
                    No activity logged.
                  </li>
                )}
              </ul>
            </section>
          </div>

          {/* Right: the document itself */}
          <div className="min-w-0">
            {openDoc ? (
              <article className="flex flex-col gap-5 rounded-xl border border-zinc-200 p-6 sm:p-8 dark:border-zinc-800">
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-zinc-200 pb-5 dark:border-zinc-800">
                  <h2 className="font-display text-xl tracking-tight">
                    {openDoc.title}
                  </h2>
                  <a
                    href={openDoc.notionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 underline underline-offset-2 hover:text-zinc-600"
                  >
                    Open in Notion
                  </a>
                </div>
                <NotionBlocks blocks={blocks} />
              </article>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-[14px] text-zinc-500 dark:border-zinc-700">
                Nothing logged against this deal yet. Once the agent ingests a
                call, transcripts and collateral appear here.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
