export type Stage =
  | "Meeting Booked"
  | "Sales Qualified Lead"
  | "Sales Qualified Opportunity"
  | "Proposal"
  | "Decision Maker Bought-In"
  | "Closed Won";

export const STAGES: Stage[] = [
  "Meeting Booked",
  "Sales Qualified Lead",
  "Sales Qualified Opportunity",
  "Proposal",
  "Decision Maker Bought-In",
  "Closed Won",
];

export type ArtefactStatus = "sent" | "waiting" | "not-applicable";

export interface Artefact {
  name: string;
  kind: "game" | "collateral" | "contract";
  status: ArtefactStatus;
  detail: string;
  href?: string;
}

export interface Quote {
  text: string;
  call: number;
  timestamp: string;
  transcriptHref: string;
}

export interface FieldConflict {
  field: string;
  values: { value: string; source: string }[];
}

export interface Deal {
  id: string;
  company: string;
  domain: string;
  industry: string;
  headcount: number;
  stage: Stage;
  value: number;
  closeDate: string;
  source: string;
  buyer: {
    name: string;
    title: string;
    seniority: string;
    tenure: string;
    linkedin: string;
  };
  context: {
    incumbent: string;
    timeline: string;
    budgetSignal: string;
    stakeholders: number;
    competitors: string[];
  };
  quotes: Quote[];
  conflicts: FieldConflict[];
  artefacts: Artefact[];
  lastActivity: string;
  callsCompleted: number;
}
