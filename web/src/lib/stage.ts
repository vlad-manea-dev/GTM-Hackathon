/** Shared stage and sentiment presentation. Kept in one place so the list
 * view, the deal page and the workflow canvas cannot drift apart. */

export const STAGE_ORDER = [
  "Meeting Booked",
  "Sales Qualified Lead",
  "Sales Qualified Opportunity",
  "Proposal",
  "Decision Maker Bought-In",
  "Closed Won",
  "Closed Lost",
] as const;

export const STAGE_TONE: Record<string, string> = {
  "Meeting Booked":
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  "Sales Qualified Lead":
    "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  "Sales Qualified Opportunity":
    "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  Proposal:
    "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  "Decision Maker Bought-In":
    "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  "Closed Won":
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  "Closed Lost": "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export const SENTIMENT_TONE: Record<string, string> = {
  Positive: "text-emerald-600 dark:text-emerald-400",
  Neutral: "text-amber-600 dark:text-amber-400",
  Sceptical: "text-orange-600 dark:text-orange-400",
  Negative: "text-red-600 dark:text-red-400",
};

export const TYPE_ICON: Record<string, string> = {
  Meeting: "🎙️",
  Email: "✉️",
  Call: "📞",
  Note: "📝",
  "Product Page": "📘",
  Game: "🎮",
  Proposal: "📝",
};

export function stageTone(stage: string | null): string {
  return (
    (stage && STAGE_TONE[stage]) ??
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
  );
}

export function stageIndex(stage: string | null): number {
  const i = STAGE_ORDER.indexOf(stage as (typeof STAGE_ORDER)[number]);
  return i === -1 ? 99 : i;
}
