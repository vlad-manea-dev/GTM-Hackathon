/**
 * Left-to-right timeline of the agent's work on one deal.
 *
 * Time is the horizontal axis — three meetings, weeks apart, scrolling right.
 * Within each meeting the work descends: read the transcript, extract, then
 * three writes off a trunk. The deal stage runs along the bottom rail so
 * progression reads left to right alongside the calendar.
 *
 * Wires are coloured by operation, not by meeting. Each column has exactly one
 * read, one CRM update, one store and one create — the rationing made visible.
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
  /** Elapsed time since the previous meeting — the spread made explicit. */
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
      { title: "Store meeting", meta: "Touchpoints ▸ DEAL-6", op: "store" },
      { title: "Draft product page", meta: "Collateral → Aoife", op: "create" },
    ],
    stage: { name: "Sales Qualified Lead", pct: "20%" },
  },
  {
    n: 2,
    date: "15 Aug",
    gap: "11 days",
    name: "Second call",
    trigger: { title: "Second call", meta: "Transcript · 24 min", op: "read" },
    outputs: [
      { title: "Update deal", meta: "Headcount 180 → 214", op: "update" },
      { title: "Store meeting", meta: "Objections, new buyer", op: "store" },
      { title: "Build the game", meta: "Personalised → Aoife", op: "create" },
    ],
    stage: { name: "Sales Qualified Opportunity", pct: "30%" },
  },
  {
    n: 3,
    date: "26 Aug",
    gap: "11 days",
    name: "Economic buyer call",
    trigger: { title: "Buyer call", meta: "Transcript · 30 min", op: "read" },
    outputs: [
      { title: "Update deal", meta: "ARR recalculated", op: "update" },
      { title: "Store meeting", meta: "Pricing, timeline", op: "store" },
      { title: "Proposal + contract", meta: "Collateral → buyer", op: "create" },
    ],
    stage: { name: "Proposal", pct: "50%" },
  },
];

const COL_W = 268;
const GAP_W = 72;

function NodeCard({ node }: { node: Node }) {
  const { color } = OPS[node.op];
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#2A3350] bg-[#1A1F2E] py-3 pl-3 pr-4">
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
    </div>
  );
}

/** Vertical wire between stacked nodes. */
function VWire({ color, height = 22 }: { color: string; height?: number }) {
  return (
    <svg
      width="2"
      height={height}
      viewBox={`0 0 2 ${height}`}
      className="mx-auto shrink-0 overflow-visible"
      aria-hidden
    >
      <line
        x1="1"
        y1="0"
        x2="1"
        y2={height}
        stroke={color}
        strokeWidth="1.5"
        opacity="0.35"
      />
      <line
        x1="1"
        y1="0"
        x2="1"
        y2={height}
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray="4 8"
        className="wire-flow-v"
      />
    </svg>
  );
}

function MeetingColumn({ meeting }: { meeting: Meeting }) {
  return (
    <div className="shrink-0" style={{ width: COL_W }}>
      {/* Time axis */}
      <div className="flex flex-col pb-5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
          Meeting {meeting.n}
        </span>
        <span className="mt-1 font-display text-2xl leading-none text-zinc-200">
          {meeting.date}
        </span>
        <span className="mt-1.5 truncate text-[11px] text-zinc-500">
          {meeting.name}
        </span>
      </div>

      <NodeCard node={meeting.trigger} />
      <VWire color={OPS.read.color} />

      <div className="flex items-center gap-3 rounded-lg border border-[#3A3358] bg-[#1E1A2E] px-3 py-3">
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
      </div>

      <VWire color="#8B7BB8" height={18} />

      {/* Three writes hanging off a trunk */}
      <div className="relative flex flex-col gap-2.5 pl-7">
        <span
          aria-hidden
          className="absolute bottom-6 left-2 top-0 w-px bg-[#2A3350]"
        />
        {meeting.outputs.map((node) => (
          <div key={node.title} className="relative">
            <span
              aria-hidden
              className="absolute top-1/2 h-px w-4"
              style={{ left: -20, background: OPS[node.op].color, opacity: 0.5 }}
            />
            <span
              aria-hidden
              className="absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full"
              style={{ left: -24, background: OPS[node.op].color }}
            />
            <NodeCard node={node} />
          </div>
        ))}
      </div>

      <VWire color="#3FBF7F" height={20} />

      {/* Stage rail */}
      <div className="rounded-lg border border-[#2E5744] bg-[#16251E] px-3 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#57BE8C]">
          Stage advanced
        </span>
        <span className="mt-1 flex items-baseline justify-between gap-2">
          <span className="truncate text-[12px] font-medium text-zinc-100">
            {meeting.stage.name}
          </span>
          <span className="shrink-0 font-mono text-[11px] text-[#57BE8C]">
            {meeting.stage.pct}
          </span>
        </span>
      </div>
    </div>
  );
}

/** The elapsed-time marker between two columns, sitting on the stage rail. */
function GapMarker({ label }: { label: string }) {
  return (
    <div
      className="relative shrink-0 self-stretch"
      style={{ width: GAP_W }}
      aria-hidden
    >
      <span className="absolute bottom-[26px] left-0 h-px w-full bg-gradient-to-r from-[#2E5744] via-[#2E5744]/50 to-[#2E5744]" />
      <span className="absolute bottom-[34px] left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-wider text-zinc-600">
        {label}
      </span>
    </div>
  );
}

export function WorkflowCanvas() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
          The run · one deal, three meetings
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
          <div className="flex items-end px-6 py-8">
            {MEETINGS.map((meeting) => (
              <div key={meeting.n} className="flex items-end">
                {meeting.gap && <GapMarker label={meeting.gap} />}
                <MeetingColumn meeting={meeting} />
              </div>
            ))}
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
          <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-zinc-600">
            Scroll right for later meetings
          </span>
        </div>
      </div>
    </section>
  );
}
