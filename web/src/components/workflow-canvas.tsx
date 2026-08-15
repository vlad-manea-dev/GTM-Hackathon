/**
 * n8n-style node canvas for the rev ops agent.
 *
 * The point the picture has to make: the agent does a slice of work after each
 * meeting rather than everything at once. So time is the vertical axis (three
 * meetings, weeks apart), work is the horizontal axis, and the deal stage
 * accumulates on the right edge.
 *
 * Wires are coloured by operation, not by row — read / update / store / create.
 * Each meeting has exactly one of each, which is the rationing made visible.
 */

const OPS = {
  read: { color: "#56C8E8", label: "Read" },
  update: { color: "#E9A13B", label: "Update CRM" },
  store: { color: "#7C8CA5", label: "Store" },
  create: { color: "#A971F5", label: "Create" },
} as const;

type Op = keyof typeof OPS;

interface Node {
  title: string;
  meta: string;
  op: Op;
}

interface Meeting {
  n: number;
  date: string;
  /** Elapsed time since the previous meeting — the "spread" made explicit. */
  gap: string | null;
  name: string;
  trigger: Node;
  outputs: [Node, Node, Node];
  stage: { name: string; pct: string };
}

const MEETINGS: Meeting[] = [
  {
    n: 1,
    date: "4 Aug",
    gap: null,
    name: "Discovery call",
    trigger: { title: "Discovery call", meta: "Transcript · 32 min", op: "read" },
    outputs: [
      { title: "Update deal", meta: "Stage, next step, date", op: "update" },
      { title: "Store meeting", meta: "Meetings ▸ DEAL-3", op: "store" },
      { title: "Draft one-pager", meta: "Collateral → Saoirse", op: "create" },
    ],
    stage: { name: "Sales Qualified Lead", pct: "20%" },
  },
  {
    n: 2,
    date: "15 Aug",
    gap: "11 days later",
    name: "Second call — product teardown",
    trigger: { title: "Second call", meta: "Transcript · 24 min", op: "read" },
    outputs: [
      { title: "Update deal", meta: "Headcount 180 → 214", op: "update" },
      { title: "Store meeting", meta: "Objections, Ravi Menon", op: "store" },
      { title: "Build the game", meta: "Personalised → Saoirse", op: "create" },
    ],
    stage: { name: "Sales Qualified Opportunity", pct: "30%" },
  },
  {
    n: 3,
    date: "26 Aug",
    gap: "11 days later",
    name: "Economic buyer call — Ravi",
    trigger: { title: "Buyer call", meta: "Transcript · 30 min", op: "read" },
    outputs: [
      { title: "Update deal", meta: "ARR €43,200 → €59,064", op: "update" },
      { title: "Store meeting", meta: "Pricing, timeline", op: "store" },
      { title: "Proposal + contract", meta: "Sent → Ravi", op: "create" },
    ],
    stage: { name: "Proposal", pct: "50%" },
  },
];

const NODE_H = 64;
const STACK_GAP = 12;
const STACK_H = NODE_H * 3 + STACK_GAP * 2;
const RAIL_W = 140;
const CHIP_W = 236;
/** Chip-centre to chip-centre: one row plus the "days later" divider. */
const ROW_PITCH = STACK_H + 40;

function Port({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="absolute top-1/2 size-2 -translate-y-1/2 rounded-full ring-2 ring-[#12151F]"
      style={{ background: color }}
    />
  );
}

function NodeCard({ node, showInPort }: { node: Node; showInPort?: boolean }) {
  const { color } = OPS[node.op];
  return (
    <div
      className="relative flex shrink-0 items-center gap-3 rounded-lg border border-[#2A3350] bg-[#1A1F2E] pl-3 pr-4"
      style={{ height: NODE_H, width: 200 }}
    >
      <span
        aria-hidden
        className="h-8 w-1 shrink-0 rounded-full"
        style={{ background: color }}
      />
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium text-zinc-100">
          {node.title}
        </span>
        <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-wider text-zinc-500">
          {node.meta}
        </span>
      </span>
      {showInPort && (
        <span className="absolute -left-1 top-1/2 -translate-y-1/2">
          <Port color={color} />
        </span>
      )}
      <span className="absolute -right-1 top-1/2 -translate-y-1/2">
        <Port color={color} />
      </span>
    </div>
  );
}

/** Straight wire between two nodes, with the flow animation on top. */
function Wire({ color, width }: { color: string; width: number }) {
  return (
    <svg
      width={width}
      height={NODE_H}
      viewBox={`0 0 ${width} ${NODE_H}`}
      className="shrink-0"
      aria-hidden
    >
      <line
        x1="0"
        y1={NODE_H / 2}
        x2={width}
        y2={NODE_H / 2}
        stroke={color}
        strokeWidth="1.5"
        opacity="0.35"
      />
      <line
        x1="0"
        y1={NODE_H / 2}
        x2={width}
        y2={NODE_H / 2}
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray="4 8"
        className="wire-flow"
      />
    </svg>
  );
}

/** One-to-three fan-out: the agent's single read becomes three writes. */
function FanOut({ colors, width = 56 }: { colors: string[]; width?: number }) {
  const mid = STACK_H / 2;
  const targets = [
    NODE_H / 2,
    NODE_H + STACK_GAP + NODE_H / 2,
    (NODE_H + STACK_GAP) * 2 + NODE_H / 2,
  ];
  return (
    <svg
      width={width}
      height={STACK_H}
      viewBox={`0 0 ${width} ${STACK_H}`}
      className="shrink-0"
      aria-hidden
    >
      {targets.map((y, i) => (
        <g key={i}>
          <path
            d={`M0 ${mid} C ${width * 0.55} ${mid}, ${width * 0.45} ${y}, ${width} ${y}`}
            fill="none"
            stroke={colors[i]}
            strokeWidth="1.5"
            opacity="0.35"
          />
          <path
            d={`M0 ${mid} C ${width * 0.55} ${mid}, ${width * 0.45} ${y}, ${width} ${y}`}
            fill="none"
            stroke={colors[i]}
            strokeWidth="1.5"
            strokeDasharray="4 8"
            className="wire-flow"
          />
        </g>
      ))}
    </svg>
  );
}

/** Three-to-one convergence into the stage chip. */
function FanIn({ colors, width = 44 }: { colors: string[]; width?: number }) {
  const mid = STACK_H / 2;
  const sources = [
    NODE_H / 2,
    NODE_H + STACK_GAP + NODE_H / 2,
    (NODE_H + STACK_GAP) * 2 + NODE_H / 2,
  ];
  return (
    <svg
      width={width}
      height={STACK_H}
      viewBox={`0 0 ${width} ${STACK_H}`}
      className="shrink-0"
      aria-hidden
    >
      {sources.map((y, i) => (
        <path
          key={i}
          d={`M0 ${y} C ${width * 0.55} ${y}, ${width * 0.45} ${mid}, ${width} ${mid}`}
          fill="none"
          stroke={colors[i]}
          strokeWidth="1.5"
          opacity="0.3"
        />
      ))}
    </svg>
  );
}

function StageChip({ stage, isLast }: { stage: Meeting["stage"]; isLast: boolean }) {
  return (
    <div
      className="relative flex shrink-0 flex-col justify-center rounded-lg border border-[#2E5744] bg-[#16251E] px-4"
      style={{ height: NODE_H, width: CHIP_W }}
    >
      <span className="font-mono text-[10px] uppercase tracking-wider text-[#57BE8C]">
        Stage advanced
      </span>
      <span className="mt-1 flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-zinc-100">
          {stage.name}
        </span>
        <span className="font-mono text-[11px] text-[#57BE8C]">{stage.pct}</span>
      </span>
      {/* The deal carrying forward into the next meeting. */}
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-1/2 top-full w-px -translate-x-1/2 bg-gradient-to-b from-[#2E5744] to-[#2E5744]/30"
          style={{ height: ROW_PITCH - NODE_H }}
        />
      )}
    </div>
  );
}

function MeetingRow({ meeting, isLast }: { meeting: Meeting; isLast: boolean }) {
  const outColors = meeting.outputs.map((o) => OPS[o.op].color);
  return (
    <div className="flex items-start gap-0">
      {/* Time rail — the reason the picture is vertical at all. */}
      <div
        className="shrink-0 pr-6"
        style={{ height: STACK_H, width: RAIL_W }}
      >
        <div className="flex h-full flex-col justify-center">
          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
            Meeting {meeting.n}
          </span>
          <span className="mt-1 font-display text-2xl leading-none text-zinc-200">
            {meeting.date}
          </span>
          <span className="mt-2 text-[11px] leading-4 text-zinc-500">
            {meeting.name}
          </span>
        </div>
      </div>

      {/* Read → extract */}
      <div className="flex items-center" style={{ height: STACK_H }}>
        <NodeCard node={meeting.trigger} />
        <Wire color={OPS.read.color} width={40} />
        <div
          className="relative flex shrink-0 items-center gap-3 rounded-lg border border-[#3A3358] bg-[#1E1A2E] px-3"
          style={{ height: NODE_H, width: 180 }}
        >
          <span
            aria-hidden
            className="grid size-7 shrink-0 place-items-center rounded-md bg-[#2C2545] font-mono text-[10px] text-[#C4A6FF]"
          >
            AI
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium text-zinc-100">
              Extract signals
            </span>
            <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              Structured output
            </span>
          </span>
          <span className="absolute -left-1 top-1/2 -translate-y-1/2">
            <Port color={OPS.read.color} />
          </span>
          <span className="absolute -right-1 top-1/2 -translate-y-1/2">
            <Port color="#8B7BB8" />
          </span>
        </div>
      </div>

      <FanOut colors={outColors} />

      {/* The three writes */}
      <div className="flex shrink-0 flex-col" style={{ gap: STACK_GAP }}>
        {meeting.outputs.map((node) => (
          <NodeCard key={node.title} node={node} showInPort />
        ))}
      </div>

      <FanIn colors={outColors} />

      <div className="flex items-center" style={{ height: STACK_H }}>
        <StageChip stage={meeting.stage} isLast={isLast} />
      </div>
    </div>
  );
}

export function WorkflowCanvas() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
          The run, deal DEAL-3 · ElevenLabs
        </p>
        <h2 className="font-display text-2xl tracking-tight sm:text-3xl">
          One slice of work per meeting
        </h2>
        <p className="max-w-xl text-[15px] leading-7 text-zinc-600 dark:text-zinc-400">
          The agent doesn&rsquo;t do everything at once. After each call it reads
          the transcript, updates the deal, files what was said, and produces one
          artifact — then waits for the next meeting. The stage moves on its own.
        </p>
      </div>

      <div className="rounded-2xl border border-[#232838] bg-[#12151F] p-1">
        <div className="canvas-grid overflow-x-auto rounded-xl">
          <div className="min-w-[1140px] px-6 py-8">
            <div className="flex flex-col">
              {MEETINGS.map((meeting, i) => (
                <div key={meeting.n}>
                  {meeting.gap && (
                    <div
                      className="flex items-center gap-3 py-3"
                      style={{ paddingLeft: RAIL_W }}
                    >
                      <span className="h-px w-8 bg-[#2A3350]" />
                      <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
                        {meeting.gap}
                      </span>
                    </div>
                  )}
                  <MeetingRow
                    meeting={meeting}
                    isLast={i === MEETINGS.length - 1}
                  />
                  {i === MEETINGS.length - 1 && (
                    <p
                      className="pt-6 font-mono text-[10px] uppercase tracking-wider text-zinc-600"
                      style={{ paddingLeft: RAIL_W }}
                    >
                      Every transcript stays queryable against the deal
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-6 py-4">
          {(Object.keys(OPS) as Op[]).map((op) => (
            <span key={op} className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ background: OPS[op].color }}
              />
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                {OPS[op].label}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
