/**
 * Typed mirror of the Notion sandbox CRM.
 *
 * Property names are the exact Notion column names — they are the wire format,
 * so they must not be "tidied up". Dates are the fiddly part: in Notion's SQL
 * layer a date column is not queryable by its plain name, only through the
 * expanded `date:<Column>:start` / `:end` / `:is_datetime` triple.
 */

export const DATA_SOURCES = {
  deals: "collection://fa5be927-353f-4a45-aa62-044f62a9a5ea",
  contacts: "collection://89585bfc-1919-4198-9dfe-5cdc50ef6126",
  companies: "collection://2fb231d7-c6f3-412e-81fb-231150a933fa",
} as const;

/** Stage → probability. Fixed by the pipeline design; never invent a value. */
export const STAGE_PROBABILITY = {
  "Meeting Booked": 0.1,
  "Sales Qualified Lead": 0.2,
  "Sales Qualified Opportunity": 0.3,
  Proposal: 0.5,
  "Decision Maker Bought-In": 0.8,
  "Closed Won": 1,
  "Closed Lost": 0,
} as const;

export type Stage = keyof typeof STAGE_PROBABILITY;

/** Pipeline order, earliest first. Used to reject backward stage moves. */
export const STAGE_ORDER: Stage[] = [
  "Meeting Booked",
  "Sales Qualified Lead",
  "Sales Qualified Opportunity",
  "Proposal",
  "Decision Maker Bought-In",
  "Closed Won",
  "Closed Lost",
];

export const PRODUCTS = [
  "Health Insurance",
  "Pension",
  "Life Assurance",
  "Dental",
  "Cash Plan",
] as const;
export type Product = (typeof PRODUCTS)[number];

export const SENTIMENTS = [
  "Positive",
  "Neutral",
  "Sceptical",
  "Negative",
] as const;
export type Sentiment = (typeof SENTIMENTS)[number];

export const DEAL_ROLES = [
  "Decision Maker",
  "Champion",
  "Economic Buyer",
  "Technical Evaluator",
  "Influencer",
] as const;
export type DealRole = (typeof DEAL_ROLES)[number];

export const DEAL_OWNERS = ["Liam Power", "George Kelly", "Sam Dunne"] as const;
export type DealOwner = (typeof DEAL_OWNERS)[number];

/** A Deal row as it comes back from the SQL layer. */
export interface Deal {
  url: string;
  "Deal ID": number;
  "Deal Name": string;
  Stage: Stage;
  Probability: number;
  "Calculated Deal ARR": number | null;
  "Number of Employees": number | null;
  /** JSON-encoded array of Product. */
  "Products Wanted": string | null;
  "Deal Owner": DealOwner | null;
  "Next Step": string | null;
  "Deal Notes": string | null;
  /** JSON-encoded array of Company page URLs. */
  Company: string | null;
  /** JSON-encoded array of Contact page URLs. */
  Contacts: string | null;
  closeDate: string | null;
  lastActivity: string | null;
}

export interface Contact {
  url: string;
  Name: string;
  "Job Title": string | null;
  Email: string | null;
  "Role in Deal": DealRole | null;
  "Call Sentiment": Sentiment | null;
  "Aspiration (from LinkedIn)": string | null;
  lastContacted: string | null;
}

/**
 * What the agent proposes to change after reading a transcript.
 * Every field is optional — the agent only writes what the call actually
 * evidenced, so an untouched field is a deliberate signal, not a gap.
 */
export interface DealUpdate {
  dealUrl: string;
  stage?: Stage;
  nextStep?: string;
  dealNotes?: string;
  numberOfEmployees?: number;
  calculatedDealArr?: number;
  productsWanted?: Product[];
  lastActivity?: string;
}

export interface ContactUpdate {
  contactUrl: string;
  callSentiment?: Sentiment;
  aspiration?: string;
  roleInDeal?: DealRole;
  lastContacted?: string;
}

/** A stakeholder named on the call who has no Contact row yet. */
export interface NewContact {
  name: string;
  jobTitle?: string;
  roleInDeal?: DealRole;
  /** Why the agent believes this person matters. Shown, never written blind. */
  evidence: string;
}

export interface IngestionResult {
  transcriptId: string;
  matchedDeal: { url: string; name: string; confidence: number; why: string };
  deal: DealUpdate;
  contacts: ContactUpdate[];
  /** Surfaced for human approval rather than created automatically. */
  newContacts: NewContact[];
  /** Competitors named on the call — the game reads these as targets. */
  competitors: string[];
}

/** Probability is always derived from Stage, never guessed. */
export function probabilityFor(stage: Stage): number {
  return STAGE_PROBABILITY[stage];
}

/** True if `next` is later in the funnel than `current`. */
export function isForwardMove(current: Stage, next: Stage): boolean {
  return STAGE_ORDER.indexOf(next) > STAGE_ORDER.indexOf(current);
}

export function parseJsonArray<T = string>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}
