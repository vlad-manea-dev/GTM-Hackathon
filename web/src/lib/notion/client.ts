/**
 * Minimal Notion REST client.
 *
 * Deliberately hand-rolled rather than pulling the SDK: we need five endpoints
 * and full control over how properties are read. Notion property values are
 * shaped per type, so every read goes through a tolerant helper — a property
 * that is missing, renamed, or a different type returns null instead of
 * throwing and taking the whole page down.
 */

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

export const DB = {
  deals: "876a2e4a-6f5b-4714-964a-276c4cb6e0a0",
  contacts: "4cc6a737-711e-4ade-a28a-71e87f62ee68",
  companies: "0a5c1107-4172-490f-9391-807a3e4ee0e9",
  touchpoints: "87edaced-0a48-44e1-9115-7dcc93d2c6a4",
  collateral: "a39bdced-905d-41e8-9ca4-7ad5933da032",
} as const;

export class NotionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "NotionError";
  }
}

async function notionFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    throw new NotionError("NOTION_TOKEN is not set", 500);
  }

  const res = await fetch(`${NOTION_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      code?: string;
      message?: string;
    } | null;
    throw new NotionError(
      body?.message ?? `Notion request failed: ${path}`,
      res.status,
    );
  }

  return (await res.json()) as T;
}

export interface NotionPage {
  id: string;
  url: string;
  properties: Record<string, RawProperty>;
}

type RawProperty = Record<string, unknown> & { type: string };

interface QueryResponse {
  results: NotionPage[];
  has_more: boolean;
  next_cursor: string | null;
}

/** Query a database, following pagination to the end. */
export async function queryDatabase(
  databaseId: string,
  body: Record<string, unknown> = {},
): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let cursor: string | undefined;

  do {
    const res = await notionFetch<QueryResponse>(
      `/databases/${databaseId}/query`,
      {
        method: "POST",
        body: JSON.stringify(cursor ? { ...body, start_cursor: cursor } : body),
      },
    );
    pages.push(...res.results);
    cursor = res.next_cursor ?? undefined;
  } while (cursor);

  return pages;
}

export async function getPage(pageId: string): Promise<NotionPage> {
  return notionFetch<NotionPage>(`/pages/${pageId}`);
}

export interface NotionBlock {
  id: string;
  type: string;
  has_children: boolean;
  children?: NotionBlock[];
  [key: string]: unknown;
}

/**
 * Fetch a page's blocks, recursing into children.
 *
 * Callouts and tables carry their content as children, so a non-recursive read
 * returns empty shells — which is exactly the content we care about here
 * (transcripts, email bodies).
 */
export async function getBlocks(
  blockId: string,
  depth = 0,
): Promise<NotionBlock[]> {
  if (depth > 3) return [];

  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const qs = cursor ? `?start_cursor=${cursor}&page_size=100` : "?page_size=100";
    const res = await notionFetch<{
      results: NotionBlock[];
      next_cursor: string | null;
    }>(`/blocks/${blockId}/children${qs}`);
    blocks.push(...res.results);
    cursor = res.next_cursor ?? undefined;
  } while (cursor);

  await Promise.all(
    blocks.map(async (block) => {
      if (block.has_children) {
        block.children = await getBlocks(block.id, depth + 1);
      }
    }),
  );

  return blocks;
}

/* -------------------------------------------------------------------------- */
/* Property readers                                                            */
/* -------------------------------------------------------------------------- */

interface RichTextItem {
  plain_text: string;
  href: string | null;
  annotations?: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
  };
}

export function plainText(items: unknown): string {
  if (!Array.isArray(items)) return "";
  return (items as RichTextItem[]).map((i) => i?.plain_text ?? "").join("");
}

function prop(page: NotionPage, name: string): RawProperty | null {
  return page.properties?.[name] ?? null;
}

export function readTitle(page: NotionPage, name: string): string {
  const p = prop(page, name);
  return p ? plainText(p.title) : "";
}

export function readText(page: NotionPage, name: string): string | null {
  const p = prop(page, name);
  if (!p) return null;
  const value = plainText(p.rich_text);
  return value || null;
}

export function readSelect(page: NotionPage, name: string): string | null {
  const p = prop(page, name);
  const select = p?.select as { name?: string } | null | undefined;
  return select?.name ?? null;
}

export function readMultiSelect(page: NotionPage, name: string): string[] {
  const p = prop(page, name);
  const items = p?.multi_select as { name: string }[] | undefined;
  return Array.isArray(items) ? items.map((i) => i.name) : [];
}

export function readNumber(page: NotionPage, name: string): number | null {
  const p = prop(page, name);
  const value = p?.number;
  return typeof value === "number" ? value : null;
}

export function readDate(page: NotionPage, name: string): string | null {
  const p = prop(page, name);
  const date = p?.date as { start?: string } | null | undefined;
  return date?.start ?? null;
}

export function readRelation(page: NotionPage, name: string): string[] {
  const p = prop(page, name);
  const items = p?.relation as { id: string }[] | undefined;
  return Array.isArray(items) ? items.map((i) => i.id) : [];
}

export function readUrl(page: NotionPage, name: string): string | null {
  const p = prop(page, name);
  return typeof p?.url === "string" ? p.url : null;
}

export function readEmail(page: NotionPage, name: string): string | null {
  const p = prop(page, name);
  return typeof p?.email === "string" ? p.email : null;
}

export function readUniqueId(page: NotionPage, name: string): number | null {
  const p = prop(page, name);
  const unique = p?.unique_id as { number?: number } | undefined;
  return typeof unique?.number === "number" ? unique.number : null;
}

/**
 * Some columns are typed differently than expected across the sandbox
 * (Industry and Country are select in places, rich text in others). Read
 * whichever one is actually present.
 */
export function readTextOrSelect(page: NotionPage, name: string): string | null {
  return readSelect(page, name) ?? readText(page, name);
}

/** Notion ids come back dashed; relation matching needs them normalised. */
export function bareId(id: string): string {
  return id.replace(/-/g, "");
}
