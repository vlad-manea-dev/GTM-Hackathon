import { DATA_SOURCES } from "@/lib/crm-types";

/**
 * Credential check for the deployed environment.
 *
 * Vercel "sensitive" env vars are write-only — they cannot be read back locally
 * via `vercel env pull`, so the only place the keys can be verified is inside a
 * running deployment. This route exists for that.
 *
 * It reports presence and upstream status codes only. It never returns, logs,
 * or echoes a key value.
 */

const DEALS_DB_ID = "876a2e4a-6f5b-4714-964a-276c4cb6e0a0";
const NOTION_VERSION = "2022-06-28";

interface Check {
  configured: boolean;
  status: number | null;
  ok: boolean;
  detail?: string;
}

async function probe(
  url: string,
  headers: Record<string, string>,
): Promise<{ status: number; ok: boolean; detail?: string }> {
  try {
    const res = await fetch(url, { headers, cache: "no-store" });
    if (res.ok) return { status: res.status, ok: true };
    // Notion returns a machine-readable `code`; surface it, never the body.
    const body = (await res.json().catch(() => null)) as {
      code?: string;
      error?: { code?: string };
    } | null;
    const detail = body?.code ?? body?.error?.code ?? undefined;
    return { status: res.status, ok: false, detail };
  } catch (err) {
    return {
      status: 0,
      ok: false,
      detail: err instanceof Error ? err.name : "fetch failed",
    };
  }
}

export async function GET() {
  const notionToken = process.env.NOTION_TOKEN;
  const openaiKey = process.env.OPENAI_API_KEY;

  const checks: Record<string, Check> = {};

  // Does the token authenticate at all?
  if (!notionToken) {
    checks.notionAuth = { configured: false, status: null, ok: false };
  } else {
    const r = await probe("https://api.notion.com/v1/users/me", {
      Authorization: `Bearer ${notionToken}`,
      "Notion-Version": NOTION_VERSION,
    });
    checks.notionAuth = { configured: true, ...r };
  }

  // A valid token still sees nothing until the integration is added to the
  // page's Connections. That failure looks like 404, not 401 — so check it
  // separately or it gets misread as a broken key.
  if (!notionToken) {
    checks.notionDealsAccess = { configured: false, status: null, ok: false };
  } else {
    const r = await probe(
      `https://api.notion.com/v1/databases/${DEALS_DB_ID}`,
      {
        Authorization: `Bearer ${notionToken}`,
        "Notion-Version": NOTION_VERSION,
      },
    );
    checks.notionDealsAccess = {
      configured: true,
      ...r,
      detail:
        r.status === 404
          ? "object_not_found — token is valid but the Rev Ops Sandbox CRM page has not been shared with this integration"
          : r.detail,
    };
  }

  if (!openaiKey) {
    checks.openai = { configured: false, status: null, ok: false };
  } else {
    const r = await probe("https://api.openai.com/v1/models", {
      Authorization: `Bearer ${openaiKey}`,
    });
    checks.openai = { configured: true, ...r };
  }

  const allOk = Object.values(checks).every((c) => c.ok);

  return Response.json(
    {
      ok: allOk,
      env: process.env.VERCEL_ENV ?? "local",
      dataSources: DATA_SOURCES,
      checks,
    },
    { status: allOk ? 200 : 503 },
  );
}
