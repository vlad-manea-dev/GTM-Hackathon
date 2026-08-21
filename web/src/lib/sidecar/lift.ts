import { Stage } from "./types";

export interface StageLift {
  stage: Stage;
  short: string;
  lift: number;
  note: string;
}

export const STAGE_LIFT: StageLift[] = [
  { stage: "Meeting Booked", short: "Meeting Booked", lift: 20, note: "Company + buyer pre-enriched before the call" },
  { stage: "Sales Qualified Lead", short: "Qualified", lift: 85, note: "Qualification fields + game written by the agent" },
  { stage: "Sales Qualified Opportunity", short: "Opportunity", lift: 80, note: "Requirements & objections captured automatically" },
  { stage: "Proposal", short: "Proposal", lift: 90, note: "Collateral pack generated, zero manual editing" },
  { stage: "Decision Maker Bought-In", short: "DM Bought-In", lift: 75, note: "Context accumulated, conflicts flagged for review" },
  { stage: "Closed Won", short: "Closed Won", lift: 95, note: "Contract templated from confirmed commercials" },
];
