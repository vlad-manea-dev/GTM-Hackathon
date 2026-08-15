"use client";

import { useCallback, useEffect, useState } from "react";
import { deals } from "@/lib/sidecar/data";
import { STAGES, Stage, Deal } from "@/lib/sidecar/types";
import styles from "./PipelineSection.module.css";
import shared from "./shared.module.css";

const bandVars: Record<Stage, string> = {
  "Meeting Booked": "--sc-band-1",
  "Sales Qualified Lead": "--sc-band-2",
  "Sales Qualified Opportunity": "--sc-band-3",
  Proposal: "--sc-band-4",
  "Decision Maker Bought-In": "--sc-band-5",
  "Closed Won": "--sc-band-6",
};

export default function PipelineSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  const selected = deals.find((d) => d.id === openId) ?? null;

  const close = useCallback(() => setOpenId(null), []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, close]);

  return (
    <section className={styles.section} aria-labelledby="pipeline-heading">
      <div className={styles.headRow}>
        <div>
          <h2 id="pipeline-heading" className={styles.heading}>
            Deals board
          </h2>
          <p className={styles.sub}>Every field came from a transcript. Open a deal to see the source line.</p>
        </div>
        <span className={styles.hint}>Select a deal for full context</span>
      </div>

      <div className={styles.board}>
        {STAGES.map((stage) => {
          const col = deals.filter((d) => d.stage === stage);
          const total = col.reduce((s, d) => s + d.value, 0);
          return (
            <div className={styles.column} key={stage}>
              <div className={styles.colHead}>
                <span className={styles.colDot} style={{ background: `var(${bandVars[stage]})` }} aria-hidden="true" />
                <span className={styles.colName}>{stage}</span>
                <span className={`${shared.num} ${styles.colCount}`}>{col.length}</span>
              </div>
              <div className={`${shared.num} ${styles.colValue}`}>€{total.toLocaleString()}</div>

              <div className={styles.cards}>
                {col.map((deal) => (
                  <button
                    key={deal.id}
                    type="button"
                    className={`${shared.glass} ${styles.card} ${openId === deal.id ? styles.cardActive : ""}`}
                    onClick={() => setOpenId(deal.id)}
                    aria-label={`Open ${deal.company}`}
                  >
                    <span className={styles.cardTop}>
                      <span className={styles.cardCo}>{deal.company}</span>
                      <span className={`${shared.num} ${styles.cardValue}`}>€{(deal.value / 1000).toFixed(deal.value < 10000 ? 1 : 0)}k</span>
                    </span>
                    <span className={styles.cardBuyer}>
                      {deal.buyer.name} · {deal.buyer.title}
                    </span>
                    <span className={styles.cardTags}>
                      <span className={styles.tag}>{deal.context.incumbent}</span>
                      {deal.conflicts.length > 0 && (
                        <span className={`${styles.tag} ${styles.tagWarn}`}>{deal.conflicts.length} conflict</span>
                      )}
                    </span>
                    <span className={styles.cardFoot}>
                      <span className={styles.dots}>
                        {deal.artefacts.map((a, i) => (
                          <span
                            key={i}
                            className={`${styles.adot} ${a.status === "sent" ? styles.adotDone : styles.adotIdle}`}
                          />
                        ))}
                        <span className={styles.dotsLabel}>
                          {deal.artefacts.filter((a) => a.status === "sent").length}/3 sent
                        </span>
                      </span>
                      <span className={styles.cardTime}>{deal.lastActivity}</span>
                    </span>
                  </button>
                ))}
                {col.length === 0 && <div className={styles.empty}>No deals</div>}
              </div>
            </div>
          );
        })}
      </div>

      {selected && <DealDrawer deal={selected} onClose={close} />}
    </section>
  );
}

function DealDrawer({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  return (
    <>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label={`${deal.company} details`}>
        <header className={styles.drawerHead}>
          <div className={styles.drawerTop}>
            <span className={styles.stageBadge} style={{ background: `var(${bandVars[deal.stage]})` }}>
              {deal.stage}
            </span>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <h3 className={styles.drawerTitle}>{deal.company}</h3>
          <p className={styles.drawerMeta}>
            {deal.industry} · {deal.headcount} employees · {deal.domain}
          </p>
          <div className={styles.progress}>
            {[1, 2, 3].map((c) => (
              <span key={c} className={`${styles.step} ${c <= deal.callsCompleted ? styles.stepDone : ""}`}>
                Call {c}
              </span>
            ))}
          </div>
        </header>

        <div className={styles.drawerBody}>
          <div className={styles.buyer}>
            <span className={styles.buyerPhoto} aria-hidden="true" />
            <div>
              <div className={styles.buyerName}>{deal.buyer.name}</div>
              <div className={styles.buyerTitle}>{deal.buyer.title}</div>
              <div className={styles.buyerTenure}>{deal.buyer.tenure}</div>
            </div>
            <span className={`${shared.num} ${styles.dealValue}`}>€{deal.value.toLocaleString()}</span>
          </div>

          {deal.quotes.length > 0 && (
            <section>
              <h4 className={styles.sectionLabel}>In their words</h4>
              <div className={styles.quotes}>
                {deal.quotes.map((q, i) => (
                  <blockquote className={styles.quote} key={i}>
                    {q.text}
                    <cite className={styles.prov}>
                      Call {q.call} · {q.timestamp}
                      <a href={q.transcriptHref}>transcript ↗</a>
                    </cite>
                  </blockquote>
                ))}
              </div>
            </section>
          )}

          <section>
            <h4 className={styles.sectionLabel}>Deal context</h4>
            <dl className={styles.fields}>
              <div className={styles.field}>
                <dt>Incumbent</dt>
                <dd>{deal.context.incumbent}</dd>
              </div>
              <div className={styles.field}>
                <dt>Timeline</dt>
                <dd>{deal.context.timeline}</dd>
              </div>
              <div className={styles.field}>
                <dt>Budget signal</dt>
                <dd>{deal.context.budgetSignal}</dd>
              </div>
              <div className={styles.field}>
                <dt>Stakeholders</dt>
                <dd>{deal.context.stakeholders} named</dd>
              </div>
            </dl>
            {deal.context.competitors.length > 0 && (
              <div className={styles.competitors}>
                <span className={styles.compLabel}>Competitors in game</span>
                {deal.context.competitors.map((c) => (
                  <span className={styles.compChip} key={c}>
                    {c}
                  </span>
                ))}
              </div>
            )}
          </section>

          {deal.conflicts.map((c, i) => (
            <div className={styles.conflict} key={i}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              </svg>
              <div>
                <strong>{c.field} conflict.</strong>{" "}
                {c.values.map((v, j) => (
                  <span key={j}>
                    {v.value} <em>({v.source})</em>
                    {j < c.values.length - 1 ? " vs. " : ""}
                  </span>
                ))}{" "}
                Both kept — nothing was overwritten.
              </div>
            </div>
          ))}

          <section>
            <h4 className={styles.sectionLabel}>Artefacts</h4>
            <div className={styles.artefacts}>
              {deal.artefacts.map((a, i) => (
                <div className={styles.artefact} key={i}>
                  <span className={`${styles.artIcon} ${styles[a.kind]}`}>
                    <ArtefactIcon kind={a.kind} />
                  </span>
                  <span className={styles.artBody}>
                    <span className={styles.artName}>{a.name}</span>
                    <span className={`${styles.artStatus} ${a.status === "sent" ? styles.statusSent : styles.statusWait}`}>
                      {a.detail}
                    </span>
                  </span>
                  {a.status === "sent" && a.href && (
                    <a className={styles.artLink} href={a.href}>
                      Open
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}

function ArtefactIcon({ kind }: { kind: "game" | "collateral" | "contract" }) {
  const common = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 };
  if (kind === "game") {
    return (
      <svg {...common} aria-hidden="true">
        <rect x="2" y="7" width="20" height="12" rx="4" />
        <path d="M8 11v4M6 13h4M15.5 13h.01M18 11h.01" />
      </svg>
    );
  }
  if (kind === "collateral") {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
    );
  }
  return (
    <svg {...common} aria-hidden="true">
      <path d="M9 12h6M9 16h6M9 8h1" />
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    </svg>
  );
}
