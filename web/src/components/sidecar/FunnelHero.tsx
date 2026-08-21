import { deals } from "@/lib/sidecar/data";
import { STAGE_LIFT } from "@/lib/sidecar/lift";
import styles from "./FunnelHero.module.css";
import shared from "./shared.module.css";

const W = 340;
const BAND_H = 56;
const GAP = 5;
const ROW = BAND_H + GAP;
const EDGES = [340, 286, 236, 190, 148, 110, 76];
const TOP_PAD = 14;

const bandVars = ["--sc-band-1", "--sc-band-2", "--sc-band-3", "--sc-band-4", "--sc-band-5", "--sc-band-6"];

export default function FunnelHero() {
  const rows = STAGE_LIFT.map((s) => ({
    ...s,
    count: deals.filter((d) => d.stage === s.stage).length,
  }));

  const avgLift = Math.round(rows.reduce((sum, r) => sum + r.lift, 0) / rows.length);
  const svgH = rows.length * BAND_H + (rows.length - 1) * GAP;

  return (
    <section className={`${shared.glass} ${styles.hero}`} aria-labelledby="funnel-heading">
      <div className={styles.headRow}>
        <div>
          <h2 id="funnel-heading" className={styles.heading}>
            Where Sidecar does the work
          </h2>
          <p className={styles.sub}>
            Agent lift — the share of each stage&rsquo;s admin handled without a rep touching it.
            <span className={styles.est}>Estimated from the three-call sandbox cycle.</span>
          </p>
        </div>
        <div className={styles.avgBox}>
          <div className={styles.avgLabel}>Average lift</div>
          <div className={`${shared.num} ${styles.avgValue}`}>{avgLift}%</div>
        </div>
      </div>

      <div className={styles.body}>
        <ol className={styles.stages}>
          {rows.map((r, i) => (
            <li className={styles.stageRow} key={r.stage}>
              <span className={styles.index}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.swatch} style={{ background: `var(${bandVars[i]})` }} aria-hidden="true" />
              <span className={styles.stageText}>
                <span className={styles.stageName}>{r.short}</span>
                <span className={styles.stageNote}>{r.note}</span>
              </span>
              <span className={styles.leader} aria-hidden="true" />
              <span className={`${shared.num} ${styles.count}`}>{r.count}</span>
              <span className={styles.meterWrap}>
                <span
                  className={styles.meterFill}
                  style={{ width: `${r.lift}%`, background: `var(${bandVars[i]})` }}
                />
              </span>
              <span className={`${shared.num} ${styles.lift}`}>{r.lift}%</span>
            </li>
          ))}
        </ol>

        <div className={styles.coneCol} aria-hidden="true">
          <svg
            className={styles.cone}
            width={W}
            height={svgH + TOP_PAD}
            viewBox={`0 ${-TOP_PAD} ${W} ${svgH + TOP_PAD}`}
            role="presentation"
          >
            <defs>
              {bandVars.map((v, i) => (
                <linearGradient id={`band${i}`} key={i} x1="0" y1="0" x2="1" y2="0.4">
                  <stop offset="0%" stopColor={`var(${v})`} stopOpacity="0.95" />
                  <stop offset="55%" stopColor={`var(${v})`} stopOpacity="0.78" />
                  <stop offset="100%" stopColor={`var(${v})`} stopOpacity="0.92" />
                </linearGradient>
              ))}
              <linearGradient id="sheen" x1="0" y1="0" x2="0.9" y2="0.3">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.42" />
                <stop offset="45%" stopColor="#fff" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* elliptical rim for depth */}
            <ellipse
              cx={W / 2}
              cy={-1}
              rx={EDGES[0] / 2}
              ry={11}
              fill={`var(${bandVars[0]})`}
              opacity="0.42"
            />
            <ellipse
              cx={W / 2}
              cy={-3}
              rx={EDGES[0] / 2 - 8}
              ry={8}
              fill="var(--surface-solid)"
              opacity="0.28"
            />

            {rows.map((r, i) => {
              const y = i * ROW;
              const wt = EDGES[i];
              const wb = EDGES[i + 1];
              const xlt = (W - wt) / 2;
              const xrt = (W + wt) / 2;
              const xlb = (W - wb) / 2;
              const xrb = (W + wb) / 2;
              const d = `M ${xlt} ${y} L ${xrt} ${y} L ${xrb} ${y + BAND_H} L ${xlb} ${y + BAND_H} Z`;
              return (
                <g key={r.stage}>
                  <path d={d} fill={`url(#band${i})`} />
                  <path d={d} fill="url(#sheen)" />
                  <text
                    x={W / 2}
                    y={y + BAND_H / 2 + 5}
                    textAnchor="middle"
                    className={styles.bandLabel}
                  >
                    {r.lift}%
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </section>
  );
}
