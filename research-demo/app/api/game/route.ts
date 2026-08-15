import deckTemplate from "../../../lib/deck.template.html?raw";

export const runtime = "nodejs";

function decode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(Buffer.from(normalized, "base64").toString("utf8"));
}

export async function GET(request: Request) {
  const value = new URL(request.url).searchParams.get("config");
  if (!value) return new Response("Missing game config", {status:400});
  let prospect: any;
  try { prospect = decode(value); } catch { return new Response("Invalid game config", {status:400}); }

  const marker = /(const CONFIG = \{.*?\n\};\n)(\/\* =+ END OF CONFIG =+ \*\/)/s;
  const match = deckTemplate.match(marker);
  if (!match) return new Response("Deck template marker not found", {status:500});
  const defaults = match[1].replace("const CONFIG =", "const TEMPLATE_CONFIG =").replace(/"?__LOGO_[A-Z0-9]+__"?/g, "null");
  const blob = JSON.stringify(prospect).replace(/<\//g, "<\\/");
  const config = `${defaults}const PROSPECT_CONFIG = ${blob};\nconst CONFIG = {\n  ...TEMPLATE_CONFIG, ...PROSPECT_CONFIG,\n  person: {...TEMPLATE_CONFIG.person, ...(PROSPECT_CONFIG.person || {})},\n  company: {...TEMPLATE_CONFIG.company, ...(PROSPECT_CONFIG.company || {})},\n  story: {...TEMPLATE_CONFIG.story, ...(PROSPECT_CONFIG.story || {})},\n  deck: {...TEMPLATE_CONFIG.deck, ...(PROSPECT_CONFIG.deck || {})},\n  vendor: {...TEMPLATE_CONFIG.vendor, ...(PROSPECT_CONFIG.vendor || {})},\n  pillars: PROSPECT_CONFIG.pillars || TEMPLATE_CONFIG.pillars\n};\n${match[2]}`;
  const html = deckTemplate.replace(marker, config).replace(/<title>.*?<\/title>/s, `<title>${String(prospect?.person?.name || "Prospect").replace(/[<>&]/g, "")} — Kota mission</title>`);
  return new Response(html, {headers:{"Content-Type":"text/html; charset=utf-8", "Cache-Control":"no-store", "X-Robots-Tag":"noindex, nofollow"}});
}
