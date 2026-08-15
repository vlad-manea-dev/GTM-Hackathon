export const runtime = "nodejs";

type Input = {
  sellerCompany?: string;
  sellerWebsite?: string;
  targetCompany: string;
  targetWebsite?: string;
  buyingPersona?: string;
  firstPartyTranscript?: string;
};

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["company", "prospect", "evidence", "game", "quality"],
  properties: {
    company: {
      type: "object", additionalProperties: false,
      required: ["name", "website", "summary", "painPoints", "timingSignals", "competitors"],
      properties: {
        name: {type:"string"}, website: {type:"string"}, summary: {type:"string"},
        painPoints: {type:"array", items:{type:"string"}, minItems:2, maxItems:5},
        timingSignals: {type:"array", items:{type:"string"}, minItems:1, maxItems:5},
        competitors: {type:"array", items:{type:"string"}, minItems:2, maxItems:4}
      }
    },
    prospect: {
      type: "object", additionalProperties: false,
      required: ["name", "title", "linkedinUrl", "whyThisPerson", "personalHooks"],
      properties: {
        name:{type:"string"}, title:{type:"string"}, linkedinUrl:{type:"string"}, whyThisPerson:{type:"string"},
        personalHooks:{type:"array", items:{type:"string"}, minItems:2, maxItems:5}
      }
    },
    evidence: {
      type:"array", minItems:5, maxItems:12,
      items:{type:"object", additionalProperties:false, required:["source","title","url","quote","claim","tier"], properties:{
        source:{type:"string"}, title:{type:"string"}, url:{type:"string"}, quote:{type:"string"}, claim:{type:"string"},
        tier:{type:"string", enum:["first-party","first-person","third-party","company-graph"]}
      }}
    },
    game: {
      type:"object", additionalProperties:false,
      required:["title","promotionTitle","mission","threat","weapon"],
      properties:{title:{type:"string"}, promotionTitle:{type:"string"}, mission:{type:"string"}, threat:{type:"string"}, weapon:{type:"string"}}
    },
    quality:{type:"object", additionalProperties:false, required:["score","caveats"], properties:{score:{type:"integer",minimum:0,maximum:100},caveats:{type:"array",items:{type:"string"},maxItems:5}}}
  }
};

function event(controller: ReadableStreamDefaultController, value: unknown) {
  controller.enqueue(new TextEncoder().encode(`${JSON.stringify(value)}\n`));
}

function compact(value: unknown, max = 12000) {
  const text = JSON.stringify(value);
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

async function aviato(path: string, params: URLSearchParams, key: string) {
  const response = await fetch(`https://data.api.aviato.co${path}?${params}`, {
    headers: {Authorization: `Bearer ${key}`, Accept: "application/json"},
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Aviato ${response.status}: ${compact(body, 500)}`);
  return body;
}

function outputText(response: any): string {
  if (response.output_text) return response.output_text;
  for (const item of response.output || []) for (const part of item.content || []) if (part.type === "output_text") return part.text;
  throw new Error("OpenAI returned no output text");
}

export async function POST(request: Request) {
  const input = await request.json() as Input;
  if (!input.targetCompany?.trim()) return Response.json({error:"Target company is required"}, {status:400});

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const openaiKey = process.env.OPENAI_API_KEY;
        const aviatoKey = process.env.AVIATO_API_KEY;
        if (!openaiKey) throw new Error("OPENAI_API_KEY is not configured on the server");

        event(controller, {type:"stage", step:0, label:"Resolving company identity"});
        let companyGraph: unknown = {provider:"aviato", status:"not_configured"};
        let peopleGraph: unknown = {provider:"aviato", status:"not_configured"};

        if (aviatoKey) {
          const companyParams = new URLSearchParams({preview:"false", full:"true"});
          if (input.targetWebsite) companyParams.set("website", input.targetWebsite);
          else companyParams.set("website", `${input.targetCompany.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`);
          try {
            companyGraph = await aviato("/company/enrich", companyParams, aviatoKey);
            event(controller, {type:"provider", provider:"Aviato", label:"Company enriched", raw:companyGraph});
          } catch (error) {
            companyGraph = {provider:"aviato", status:"error", message:String(error)};
            event(controller, {type:"warning", provider:"Aviato", message:String(error)});
          }

          event(controller, {type:"stage", step:1, label:"Finding the buying committee"});
          const peopleParams = new URLSearchParams({page:"1", perPage:"10", enrich:"false"});
          peopleParams.append("currentCompanyNames", input.targetCompany);
          for (const dept of ["Human Resources", "Operations", "People"]) peopleParams.append("currentDepartments", dept);
          try {
            peopleGraph = await aviato("/person/simple/search", peopleParams, aviatoKey);
            event(controller, {type:"provider", provider:"Aviato", label:"Candidate buyers returned", raw:peopleGraph});
          } catch (error) {
            peopleGraph = {provider:"aviato", status:"error", message:String(error)};
            event(controller, {type:"warning", provider:"Aviato", message:String(error)});
          }
        } else {
          event(controller, {type:"warning", provider:"Aviato", message:"AVIATO_API_KEY not configured; web research will resolve the buyer."});
        }

        event(controller, {type:"stage", step:2, label:"Searching public evidence"});
        const prompt = `You are a rigorous GTM research analyst creating a personalised proposal game.

Seller: ${input.sellerCompany || "Kota"} (${input.sellerWebsite || "kota.io"}), a benefits infrastructure company.
Target: ${input.targetCompany}${input.targetWebsite ? ` (${input.targetWebsite})` : ""}.
Buying persona: ${input.buyingPersona || "the most senior person who owns global employee benefits, People Operations, or Total Rewards"}.

AVIATO COMPANY RESULT:\n${compact(companyGraph)}
AVIATO PEOPLE RESULT:\n${compact(peopleGraph)}
FIRST-PARTY CALL TRANSCRIPT (may be empty):\n${(input.firstPartyTranscript || "").slice(0, 12000)}

Research the target company and identify ONE currently employed decision maker for this purchase. Search official company pages, careers pages, interviews, podcasts, conference appearances, and the prospect's public professional posts. Find specific personal hooks only when directly evidenced. Research the company's business pressures, hiring/geographic expansion, benefits/People pain that ${input.sellerCompany || "Kota"} can credibly address, and 2-4 genuine competitors suitable as game enemies.

Rules:
- Every evidence item must have a real public URL. Never invent a quote, URL, person, title, or personal detail.
- quote must be a short verbatim excerpt when available; otherwise use an empty string.
- Prefer official/first-person sources. Separate evidence from inference.
- Do not use sensitive personal data, private-life speculation, contact details, protected traits, or anything irrelevant to professional outreach.
- If identity is uncertain, say so in caveats and lower the quality score.
- Game copy must be flattering, brief, and grounded in the evidence.`;

        const response = await fetch("https://api.openai.com/v1/responses", {
          method:"POST",
          headers:{Authorization:`Bearer ${openaiKey}`, "Content-Type":"application/json"},
          body:JSON.stringify({
            model:process.env.OPENAI_RESEARCH_MODEL || "gpt-5.4-mini",
            input:prompt,
            tools:[{type:"web_search_preview"}],
            max_tool_calls:8,
            reasoning:{effort:"medium"},
            text:{format:{type:"json_schema", name:"gtm_research_pack", strict:true, schema}}
          })
        });
        const openai = await response.json();
        if (!response.ok) throw new Error(`OpenAI ${response.status}: ${compact(openai, 800)}`);
        event(controller, {type:"stage", step:3, label:"Verifying claims and creative hooks"});
        const result = JSON.parse(outputText(openai));
        event(controller, {type:"result", result, meta:{responseId:openai.id, model:openai.model, aviatoUsed:Boolean(aviatoKey)}});
      } catch (error) {
        event(controller, {type:"error", message:error instanceof Error ? error.message : String(error)});
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {headers:{"Content-Type":"application/x-ndjson; charset=utf-8", "Cache-Control":"no-store"}});
}
