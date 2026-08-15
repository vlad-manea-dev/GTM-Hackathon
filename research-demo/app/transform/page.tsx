"use client";
import { ArrowDown, ArrowUpRight, Check, Code2, FileJson2, Sparkles, TriangleAlert } from "lucide-react";
import { PipelineNav } from "../components/PipelineNav";

const claims=[
 {id:"C-01",claim:"Victoria leads operations spanning People and talent.",kind:"Identity fact",source:"Scaling Europe interview",score:91,use:"Select as executive influencer"},
 {id:"C-02",claim:"She believes excellent operations should be invisible.",kind:"First-person belief",source:"Victoria's LinkedIn post",score:97,use:"Core game metaphor"},
 {id:"C-03",claim:"Her career began in astrophysics.",kind:"Career fact",source:"Work in Progress podcast",score:91,use:"Orbit / constellation setting"},
 {id:"C-04",claim:"Benefits administration sits inside ElevenLabs People Ops.",kind:"Company fact",source:"Official job description",score:98,use:"Kota value intersection"},
 {id:"C-05",claim:"Rapid global scale creates benefit complexity.",kind:"Commercial inference",source:"C-01 + C-04 + careers",score:83,use:"Narrative tension · not a quote"},
];
const config=`{
  "person": {
    "name": "Victoria Weller",
    "title": "Operations",
    "promotionTitle": "The Invisible Operator"
  },
  "company": { "name": "ElevenLabs" },
  "enemies": ["OpenAI", "Descript", "Murf AI", "PlayHT"],
  "story": {
    "threat": "THE TALENT WAR",
    "mission": "BUILD QUIETLY. SCALE BRILLIANTLY.",
    "weapon": "BENEFITS THEY CAN'T MATCH"
  },
  "vendor": { "name": "Kota", "accentColor": "#6C5CE7" }
}`;

export default function Transform(){return <main className="detailPage"><header className="detailHeader"><div className="brand"><span>y</span>yonder</div><PipelineNav/><div className="recordBadge"><i/> EVIDENCE RUN #EL-041</div></header><div className="detailWrap"><div className="pageLead"><div><small>02 · EVIDENCE TRANSFORMATION</small><h1>From messy text to game-safe truth.</h1><p>The agent keeps facts, quotes and inferences separate—then maps only approved claims into the game contract.</p></div><div className="qualityStamp"><Check/> 96 <span>QUALITY<br/>SCORE</span></div></div>
 <div className="transformFlow"><section><div className="flowTitle"><span>1</span><div><b>Evidence ledger</b><small>Normalized claims with provenance</small></div></div><div className="claimStack">{claims.map(c=><article key={c.id}><div className="claimId">{c.id}</div><div className="claimBody"><div><span>{c.kind}</span><em>{c.score}%</em></div><b>{c.claim}</b><small>Source: {c.source}</small><p><Sparkles/> {c.use}</p></div></article>)}</div></section><div className="flowArrow"><ArrowDown/><span>rules + human gate</span></div><section><div className="flowTitle"><span>2</span><div><b>Game-template contract</b><small>Only fields the fixed engine understands</small></div></div><div className="contractNotes"><div><Check/> Names and company are verified</div><div><Check/> Personal metaphor cites C-02/C-03</div><div><TriangleAlert/> Competitor set requires human review</div><div><Check/> No private or sensitive traits</div></div><div className="codePanel"><div><Code2/> generated-config.json <span>READY FOR REVIEW</span></div><pre>{config}</pre></div></section></div>
 <section className="engineRule"><FileJson2/><div><small>THE ARCHITECTURE</small><b>Research changes the config. It never edits the game engine.</b><p>The cloned publisher replaces one marked CONFIG block, inlines logos, generates the preview card, and writes a self-contained HTML game.</p></div><code>config.json → publish.py → game.template.html → /g/victoria11</code></section>
 <div className="nextStep"><div><small>NEXT</small><b>Inspect the exact generated game</b></div><a href="/game">Open game output <ArrowUpRight/></a></div>
 </div></main>}
