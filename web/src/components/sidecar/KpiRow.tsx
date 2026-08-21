import { computeMetrics } from "@/lib/sidecar/metrics";
import styles from "./KpiRow.module.css";
import shared from "./shared.module.css";

export default function KpiRow() {
  const m = computeMetrics();
  const bandVars = ["--sc-band-1", "--sc-band-2", "--sc-band-3", "--sc-band-4", "--sc-band-5", "--sc-band-6"];

  const flowMax = Math.max(...m.stageCounts.map((s) => s.count), 1);

  return (
    <div className={styles.row}>
      {/* 1 — pipeline value, shown as stage-by-stage ribbon */}
      <article className={`${shared.glass} ${styles.card}`}>
        <div className={styles.head}>
          <h2>Open pipeline</h2>
          <span className={styles.chip}>{m.openCount} deals</span>
        </div>
        <div className={`${shared.num} ${styles.value}`}>€{m.openValue.toLocaleString()}</div>
        <div className={styles.ribbon} aria-hidden="true">
          {m.stageCounts.map((s, i) => (
            <span
              key={s.stage}
              className={styles.ribbonSeg}
              style={{
                height: `${18 + (s.count / flowMax) * 82}%`,
                background: `var(${bandVars[i]})`,
              }}
            />
          ))}
        </div>
        <p className={styles.foot}>Spread across all six stages</p>
      </article>

      {/* 2 — fields, shown as stepped bars per deal */}
      <article className={`${shared.glass} ${styles.card}`}>
        <div className={styles.head}>
          <h2>Fields auto-populated</h2>
          <span className={styles.chip}>{m.fieldsPerDeal.length} records</span>
        </div>
        <div className={`${shared.num} ${styles.value}`}>{m.totalFields}</div>
        <div className={styles.bars} aria-hidden="true">
          {m.fieldsPerDeal.map((v, i) => (
            <span
              key={i}
              className={styles.bar}
              style={{ height: `${(v / Math.max(...m.fieldsPerDeal)) * 100}%` }}
            />
          ))}
        </div>
        <p className={styles.foot}>Zero typed by a rep</p>
      </article>

      {/* 3 — artefact completion, shown as a radial gauge */}
      <article className={`${shared.glass} ${styles.card}`}>
        <div className={styles.head}>
          <h2>Artefacts delivered</h2>
          <span className={styles.chip}>
            {m.sentArtefactsCount}/{m.totalArtefactsCount}
          </span>
        </div>
        <div className={styles.gaugeWrap}>
          <svg viewBox="0 0 120 66" className={styles.gauge} aria-hidden="true">
            <defs>
              <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--accent-2)" />
              </linearGradient>
            </defs>
            <path d="M12 60 A48 48 0 0 1 108 60" fill="none" stroke="var(--line)" strokeWidth="10" strokeLinecap="round" />
            <path
              d="M12 60 A48 48 0 0 1 108 60"
              fill="none"
              stroke="url(#gaugeGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="151"
              strokeDashoffset={151 - (m.completionRate / 100) * 151}
            />
          </svg>
          <div className={`${shared.num} ${styles.gaugeValue}`}>{m.completionRate}%</div>
        </div>
        <p className={styles.foot}>Games, packs and contracts sent</p>
      </article>

      {/* 4 — conflicts, shown as a dot matrix (one dot per deal) */}
      <article className={`${shared.glass} ${styles.card} ${m.conflictDeals.length ? styles.cardWarn : ""}`}>
        <div className={styles.head}>
          <h2>Conflicts flagged</h2>
          <span className={styles.chip}>needs a human</span>
        </div>
        <div className={`${shared.num} ${styles.value}`}>{m.conflictDeals.length}</div>
        <div className={styles.dots} aria-hidden="true">
          {m.fieldsPerDeal.map((_, i) => (
            <span key={i} className={i < m.conflictDeals.length ? styles.dotWarn : styles.dotIdle} />
          ))}
        </div>
        <p className={styles.foot}>Contradictions kept, never overwritten</p>
      </article>
    </div>
  );
}
