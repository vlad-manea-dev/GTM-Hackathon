/**
 * Typed reads over the Notion sandbox CRM.
 *
 * One rule throughout: the Notion column names are the wire format. They are
 * translated to camelCase exactly once, here, so the rest of the app never has
 * to know that a column is called "Aspiration (from LinkedIn)".
 */

import {
  DB,
  NotionPage,
  bareId,
  queryDatabase,
  readDate,
  readEmail,
  readMultiSelect,
  readNumber,
  readRelation,
  readSelect,
  readText,
  readTextOrSelect,
  readTitle,
  readUniqueId,
  readUrl,
} from "./client";

export interface Deal {
  pageId: string;
  dealId: number | null;
  name: string;
  stage: string | null;
  probability: number | null;
  arr: number | null;
  employees: number | null;
  products: string[];
  owner: string | null;
  nextStep: string | null;
  notes: string | null;
  closeDate: string | null;
  lastActivity: string | null;
  companyIds: string[];
  contactIds: string[];
  notionUrl: string;
}

export interface Contact {
  pageId: string;
  name: string;
  jobTitle: string | null;
  email: string | null;
  role: string | null;
  sentiment: string | null;
  aspiration: string | null;
  lastContacted: string | null;
  linkedin: string | null;
  notionUrl: string;
}

export interface Company {
  pageId: string;
  name: string;
  domain: string | null;
  industry: string | null;
  hq: string | null;
  country: string | null;
  employees: number | null;
  notionUrl: string;
}

export interface Touchpoint {
  pageId: string;
  touchpointId: number | null;
  subject: string;
  type: string | null;
  date: string | null;
  direction: string | null;
  summary: string | null;
  durationMin: number | null;
  sentiment: string | null;
  owner: string | null;
  dealIds: string[];
  contactIds: string[];
  notionUrl: string;
}

export interface Collateral {
  pageId: string;
  title: string;
  type: string | null;
  status: string | null;
  sentDate: string | null;
  link: string | null;
  summary: string | null;
  owner: string | null;
  dealIds: string[];
  contactIds: string[];
  notionUrl: string;
}

function toDeal(page: NotionPage): Deal {
  return {
    pageId: bareId(page.id),
    dealId: readUniqueId(page, "Deal ID"),
    name: readTitle(page, "Deal Name"),
    stage: readSelect(page, "Stage"),
    probability: readNumber(page, "Probability"),
    arr: readNumber(page, "Calculated Deal ARR"),
    employees: readNumber(page, "Number of Employees"),
    products: readMultiSelect(page, "Products Wanted"),
    owner: readSelect(page, "Deal Owner"),
    nextStep: readText(page, "Next Step"),
    notes: readText(page, "Deal Notes"),
    closeDate: readDate(page, "Close Date"),
    lastActivity: readDate(page, "Last Activity"),
    companyIds: readRelation(page, "Company").map(bareId),
    contactIds: readRelation(page, "Contacts").map(bareId),
    notionUrl: page.url,
  };
}

function toContact(page: NotionPage): Contact {
  return {
    pageId: bareId(page.id),
    name: readTitle(page, "Name"),
    jobTitle: readText(page, "Job Title"),
    email: readEmail(page, "Email"),
    role: readSelect(page, "Role in Deal"),
    sentiment: readSelect(page, "Call Sentiment"),
    aspiration: readText(page, "Aspiration (from LinkedIn)"),
    lastContacted: readDate(page, "Last Contacted"),
    linkedin: readUrl(page, "LinkedIn"),
    notionUrl: page.url,
  };
}

function toCompany(page: NotionPage): Company {
  return {
    pageId: bareId(page.id),
    name: readTitle(page, "Name"),
    domain: readUrl(page, "Domain"),
    industry: readTextOrSelect(page, "Industry"),
    hq: readTextOrSelect(page, "HQ"),
    country: readTextOrSelect(page, "Country"),
    employees: readNumber(page, "Number of Employees"),
    notionUrl: page.url,
  };
}

function toTouchpoint(page: NotionPage): Touchpoint {
  return {
    pageId: bareId(page.id),
    touchpointId: readUniqueId(page, "Touchpoint ID"),
    subject: readTitle(page, "Subject"),
    type: readSelect(page, "Type"),
    date: readDate(page, "Date"),
    direction: readSelect(page, "Direction"),
    summary: readText(page, "Summary"),
    durationMin: readNumber(page, "Duration (min)"),
    sentiment: readSelect(page, "Sentiment"),
    owner: readSelect(page, "Owner"),
    dealIds: readRelation(page, "Deal").map(bareId),
    contactIds: readRelation(page, "Contacts").map(bareId),
    notionUrl: page.url,
  };
}

function toCollateral(page: NotionPage): Collateral {
  return {
    pageId: bareId(page.id),
    title: readTitle(page, "Title"),
    type: readSelect(page, "Type"),
    status: readSelect(page, "Status"),
    sentDate: readDate(page, "Sent Date"),
    link: readUrl(page, "Link"),
    summary: readText(page, "Summary"),
    owner: readSelect(page, "Owner"),
    dealIds: readRelation(page, "Deal").map(bareId),
    contactIds: readRelation(page, "Contacts").map(bareId),
    notionUrl: page.url,
  };
}

export async function listDeals(): Promise<Deal[]> {
  const pages = await queryDatabase(DB.deals);
  return pages.map(toDeal);
}

export async function listContacts(): Promise<Contact[]> {
  const pages = await queryDatabase(DB.contacts);
  return pages.map(toContact);
}

export async function listCompanies(): Promise<Company[]> {
  const pages = await queryDatabase(DB.companies);
  return pages.map(toCompany);
}

export async function listTouchpoints(): Promise<Touchpoint[]> {
  const pages = await queryDatabase(DB.touchpoints);
  return pages.map(toTouchpoint);
}

export async function listCollateral(): Promise<Collateral[]> {
  const pages = await queryDatabase(DB.collateral);
  return pages.map(toCollateral);
}

export interface DealDetail {
  deal: Deal;
  company: Company | null;
  contacts: Contact[];
  touchpoints: Touchpoint[];
  collateral: Collateral[];
}

/**
 * Everything needed to render one deal page.
 *
 * Touchpoints and collateral are filtered by their own Deal relation rather
 * than the deal's back-relation — the relation on the child is the one the
 * agent writes, so it is the one that stays correct.
 */
export async function getDealDetail(
  dealId: number,
): Promise<DealDetail | null> {
  const [deals, contacts, companies, touchpoints, collateral] =
    await Promise.all([
      listDeals(),
      listContacts(),
      listCompanies(),
      listTouchpoints(),
      listCollateral(),
    ]);

  const deal = deals.find((d) => d.dealId === dealId);
  if (!deal) return null;

  return {
    deal,
    company:
      companies.find((c) => deal.companyIds.includes(c.pageId)) ?? null,
    contacts: contacts.filter((c) => deal.contactIds.includes(c.pageId)),
    touchpoints: touchpoints
      .filter((t) => t.dealIds.includes(deal.pageId))
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")),
    collateral: collateral.filter((c) => c.dealIds.includes(deal.pageId)),
  };
}

/** Deals with the most activity first — the ones worth clicking into. */
export async function listDealsWithActivity(): Promise<
  (Deal & { touchpointCount: number; collateralCount: number })[]
> {
  const [deals, touchpoints, collateral] = await Promise.all([
    listDeals(),
    listTouchpoints(),
    listCollateral(),
  ]);

  return deals.map((deal) => ({
    ...deal,
    touchpointCount: touchpoints.filter((t) => t.dealIds.includes(deal.pageId))
      .length,
    collateralCount: collateral.filter((c) => c.dealIds.includes(deal.pageId))
      .length,
  }));
}

export function formatEur(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
