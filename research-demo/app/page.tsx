"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Bot, BriefcaseBusiness, Check, CheckCircle2, CircleUserRound, Copy, Database, ExternalLink, Globe2, Play, Radio, RotateCcw, Search, ShieldCheck, Sparkles, WandSparkles, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PipelineNav } from "./components/PipelineNav";
import { elevenLabsVerifiedRun } from "./data/elevenlabs-cache";
import "./result-links.css";
import "./live.css";
import "./cache.css";

type Evidence = {source:string;title:string;url:string;quote:string;claim:string;tier:string};
type Result = {
  company:{name:string;website:string;summary:string;painPoints:string[];timingSignals:string[];competitors:string[]};
  prospect:{name:string;title:string;linkedinUrl:string;whyThisPerson:string;personalHooks:string[]};
  evidence:Evidence[];
  game:{title:string;promotionTitle:string;mission:string;threat:string;weapon:string};
  quality:{score:number;caveats:string[]};
};
type ProviderEvent = {provider:string;label:string;raw:unknown};
type Phase = "setup"|"running"|"done"|"error";

const steps = [
  {label:"Resolving company identity",source:"Aviato company graph"},
  {label:"Finding the buying committee",source:"Aviato people search"},
  {label:"Searching public evidence",source:"Official web · careers · interviews"},
  {label:"Verifying claims and creative hooks",source:"OpenAI Responses · web search"},
  {label:"Composing the Deck game",source:"Structured game contract"},
];

function encodeConfig(result:Result) {
  const config = {
    person:{name:result.prospect.name,title:result.prospect.title,promotionTitle:result.game.promotionTitle},
    company:{name:result.company.name},
    enemies:result.company.competitors.slice(0,4).map(name=>({name})),
    story:{threat:result.game.threat,mission:result.game.mission,verb:"OUT-HIRED",weapon:result.game.weapon},
    vendor:{name:"Kota",tagline:"Global benefits. Quietly brilliant.",accentColor:"#6C5CE7",ctaUrl:"https://kota.io/demo"},
    share:{title:result.game.title,description:`A personalised proposal for ${result.prospect.name} at ${result.company.name}.`}
  };
  const bytes = new TextEncoder().encode(JSON.stringify(config));
  let binary=""; bytes.forEach(byte=>binary+=String.fromCharCode(byte));
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}

export default function Home(){
  const [phase,setPhase]=useState<Phase>("setup");
  const [target,setTarget]=useState("ElevenLabs");
  const [website,setWebsite]=useState("elevenlabs.io");
  const [persona,setPersona]=useState("Global benefits / People Operations decision-maker");
  const [transcript,setTranscript]=useState("");
  const [step,setStep]=useState(0);
  const [elapsed,setElapsed]=useState(0);
  const [providers,setProviders]=useState<ProviderEvent[]>([]);
  const [warnings,setWarnings]=useState<string[]>([]);
  const [result,setResult]=useState<Result|null>(null);
  const [error,setError]=useState("");
  const [copied,setCopied]=useState(false);
  const [rawOpen,setRawOpen]=useState(false);
  const [cacheMeta,setCacheMeta]=useState<{runId:string;cachedAt:string}|null>(null);
  const [replayingCache,setReplayingCache]=useState(false);
  const abortRef=useRef<AbortController|null>(null);
  const cacheChosenRef=useRef(false);
  const gamePath=useMemo(()=>result?`/api/game?config=${encodeConfig(result)}`:"",[result]);

  useEffect(()=>{
    if(phase!=="running") return;
    const start=Date.now(); const timer=setInterval(()=>setElapsed((Date.now()-start)/1000),100);
    return()=>clearInterval(timer);
  },[phase]);

  useEffect(()=>{
    if(!replayingCache) return;
    const cachedProviders:ProviderEvent[]=elevenLabsVerifiedRun.result.evidence.map((e,index)=>({
      provider:index===0?"Aviato":e.source,
      label:e.title,
      raw:{source:e.url,excerpt:e.quote||e.claim,claim:e.claim,tier:e.tier,verified:true}
    }));
    setProviders([]);setStep(0);setElapsed(0);setWarnings([]);
    const timers:ReturnType<typeof setTimeout>[]=[];
    [0,1,2,3,4].forEach((next,index)=>timers.push(setTimeout(()=>setStep(next),index*1250)));
    cachedProviders.forEach((provider,index)=>timers.push(setTimeout(()=>setProviders(current=>[...current,provider]),650+index*850)));
    timers.push(setTimeout(()=>{
      setResult(structuredClone(elevenLabsVerifiedRun.result) as Result);
      setStep(5);setReplayingCache(false);setPhase("done");
    },6600));
    return()=>timers.forEach(clearTimeout);
  },[replayingCache]);

  const preset=(name:"ElevenLabs"|"Synthesia")=>{
    if(name==="ElevenLabs"){setTarget("ElevenLabs");setWebsite("elevenlabs.io");}
    else{setTarget("Synthesia");setWebsite("synthesia.io");}
  };

  const launch=async()=>{
    if(!target.trim()) return;
    setPhase("running");setStep(0);setElapsed(0);setProviders([]);setWarnings([]);setResult(null);setError("");setCacheMeta(null);setReplayingCache(false);cacheChosenRef.current=false;
    const controller=new AbortController();abortRef.current=controller;
    try{
      const response=await fetch("/api/research",{method:"POST",headers:{"Content-Type":"application/json"},signal:controller.signal,body:JSON.stringify({sellerCompany:"Kota",sellerWebsite:"kota.io",targetCompany:target,targetWebsite:website,buyingPersona:persona,firstPartyTranscript:transcript})});
      if(!response.ok||!response.body) throw new Error((await response.json().catch(()=>null))?.error||`Request failed (${response.status})`);
      const reader=response.body.getReader(); const decoder=new TextDecoder(); let buffer="";
      while(true){
        const {done,value}=await reader.read(); buffer+=decoder.decode(value||new Uint8Array(),{stream:!done});
        const lines=buffer.split("\n"); buffer=lines.pop()||"";
        for(const line of lines){if(!line)continue;const e=JSON.parse(line);
          if(e.type==="stage") setStep(e.step);
          if(e.type==="provider") setProviders(p=>[...p,e]);
          if(e.type==="warning") setWarnings(w=>[...w,`${e.provider}: ${e.message}`]);
          if(e.type==="result"&&!cacheChosenRef.current){setResult(e.result);setStep(5);setPhase("done");}
          if(e.type==="error") throw new Error(e.message);
        }
        if(done) break;
      }
      if(!result&&phase==="running"){} // state is finalized by the streamed result event
    }catch(e){if(!cacheChosenRef.current){setError(e instanceof Error?e.message:String(e));setPhase("error");}}
  };
  const pullVerifiedRun=()=>{
    cacheChosenRef.current=true;abortRef.current?.abort();
    setCacheMeta({runId:elevenLabsVerifiedRun.runId,cachedAt:elevenLabsVerifiedRun.cachedAt});
    setResult(null);setReplayingCache(true);setPhase("running");
  };
  const reset=()=>{abortRef.current?.abort();setReplayingCache(false);setPhase("setup");setStep(0);setResult(null);setProviders([]);setWarnings([]);setCacheMeta(null)};
  const copy=async()=>{await navigator.clipboard.writeText(`${window.location.origin}${gamePath}`);setCopied(true);setTimeout(()=>setCopied(false),1600)};
  const initials=(result?.company.name||target).split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase();

  return <main>
    <header className="topbar"><div className="brand"><span>y</span>yonder</div><PipelineNav/><div className="agentLive"><i/> live providers ready</div><div className="demoTag">REAL DATA</div><button className="avatar">GK</button></header>
    <AnimatePresence mode="wait">
      {phase==="setup"&&<motion.section key="setup" className="setupScreen" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,y:-16}}>
        <div className="setupIntro"><div className="kicker"><Sparkles size={14}/> LIVE RESEARCH-TO-DECK</div><h1>Type any company.<br/><em>Ship evidence, not mail merge.</em></h1><p>Aviato resolves the account and buyer. OpenAI searches and verifies public evidence. The result becomes a real personalised Kota deck.</p></div>
        <div className="launchPanel liveForm">
          <div className="panelHead"><div><small>NEW LIVE RUN</small><strong>Who are we researching?</strong></div><div className="presetButtons"><button onClick={()=>preset("ElevenLabs")}>ElevenLabs</button><button onClick={()=>preset("Synthesia")}>Synthesia</button></div></div>
          <div className="inputGrid">
            <div className="inputCard"><label>SELLER</label><div className="accountRow"><div className="logo kota">K</div><div><b>Kota</b><span>kota.io · Benefits infrastructure</span></div><CheckCircle2 size={18}/></div></div>
            <div className="arrowCell"><ArrowRight size={18}/></div>
            <div className="inputCard liveTarget"><label>TARGET ACCOUNT</label><input value={target} onChange={e=>setTarget(e.target.value)} placeholder="e.g. Stripe"/><input value={website} onChange={e=>setWebsite(e.target.value)} placeholder="website.com (optional)"/></div>
          </div>
          <div className="liveExtras"><label>BUYING PERSONA<input value={persona} onChange={e=>setPersona(e.target.value)}/></label><label>FIRST-PARTY CALL NOTES <em>optional</em><textarea value={transcript} onChange={e=>setTranscript(e.target.value)} placeholder="Paste a call transcript or CRM notes to ground the research in what the buyer already told you."/></label></div>
          <div className="scope"><div><BriefcaseBusiness size={16}/><span><b>Live providers</b>Aviato + public web</span></div><div><ShieldCheck size={16}/><span><b>Evidence policy</b>Public professional context only</span></div></div>
          <button className="primary" onClick={launch}><Zap size={18} fill="currentColor"/> Run live research & build deck <ArrowUpRight size={18}/></button>
        </div>
        <div className="sourceStrip"><span>ACTUAL CALLS TO</span><b>Aviato Data API</b><i/><b>OpenAI Responses API</b><i/><b>Web search</b><i/><b>Deck Template</b></div>
      </motion.section>}

      {phase==="running"&&<motion.section key="running" className="runScreen" initial={{opacity:0}} animate={{opacity:1}}>
        <div className="runHeader"><div><div className="crumb">KOTA <span>/</span> {target.toUpperCase()}</div><h2>{replayingCache?<>Replaying verified intelligence for <em>ElevenLabs</em></>:<>Researching <em>{target}</em> from live sources</>}</h2></div><div className="runControls"><button className={`cachePull ${replayingCache?"replaying":""}`} onClick={pullVerifiedRun} disabled={replayingCache}><Database size={14}/><span><small>{replayingCache?"VERIFIED RUN EL-041":"PREVIOUSLY RESEARCHED"}</small>{replayingCache?"Restoring evidence…":"Pull verified run"}</span>{replayingCache?<span className="cacheSpinner"/>:<ArrowRight size={14}/>}</button><div className="timer"><small>{replayingCache?"REPLAY":"ELAPSED"}</small><b>{elapsed.toFixed(1)}s</b></div></div></div>
        <div className="pipeline">
          <aside className="stages">{steps.map((s,i)=><div className={`stage ${i<step?"complete":i===step?"active":""}`} key={s.label}><div className="stageDot">{i<step?<Check size={13}/>:i+1}</div><div><b>{s.label}</b><span>{s.source}</span></div>{i===step&&<motion.i layoutId="activeGlow"/>}</div>)}</aside>
          <section className="researchCanvas"><div className="canvasTop"><span><Radio size={14}/> LIVE PROVIDER STREAM</span><b>{providers.length} responses received</b></div><div className="orbit"><motion.div className="agentCore" animate={{boxShadow:["0 0 20px rgba(216,255,97,.12)","0 0 70px rgba(216,255,97,.35)","0 0 20px rgba(216,255,97,.12)"]}} transition={{duration:2,repeat:Infinity}}><Bot size={26}/><span>RESEARCH<br/>AGENT</span></motion.div><div className="ring ring1"/><div className="ring ring2"/></div><div className="evidenceGrid"><AnimatePresence>{providers.slice(0,6).map((p,i)=><motion.article className={`evidence e${i}`} key={`${p.provider}-${i}`} initial={{opacity:0,scale:.78,y:15}} animate={{opacity:1,scale:1,y:0}}><div className="evidenceTop"><span className="sourceIcon"><Database size={16}/></span><small>{p.provider}</small><CheckCircle2 size={14}/></div><b>{p.label}</b><p>{JSON.stringify(p.raw).slice(0,115)}…</p><span className="tier">RAW API RESPONSE</span></motion.article>)}</AnimatePresence></div><motion.div className="scanMessage"><span className="scanLine"/><Search size={15}/> {steps[Math.min(step,4)].label}…</motion.div></section>
          <aside className="intelPanel"><div className="intelTitle"><CircleUserRound size={17}/> RUN PROVENANCE</div><div className="providerStatus"><b>Aviato</b><span>{providers.some(p=>p.provider==="Aviato")?"response received":"waiting / optional"}</span><b>OpenAI web search</b><span>{step>=2?"researching":"queued"}</span><b>First-party notes</b><span>{transcript?`${transcript.length} characters supplied`:"none supplied"}</span></div>{warnings.map(w=><p className="runWarning" key={w}>{w}</p>)}<button className="rawToggle" onClick={()=>setRawOpen(!rawOpen)}>{rawOpen?"Hide":"Inspect"} raw data</button></aside>
        </div>{rawOpen&&<pre className="rawDrawer">{JSON.stringify(providers,null,2)}</pre>}
      </motion.section>}

      {phase==="done"&&result&&<motion.section key="done" className="doneScreen" initial={{opacity:0}} animate={{opacity:1}}>
        <motion.div className="successOrb" initial={{scale:0}} animate={{scale:1}}><Check size={30}/></motion.div><div className="doneIntro"><span>{cacheMeta?`VERIFIED RUN ${cacheMeta.runId} RESTORED · DECK READY`:"LIVE RESEARCH COMPLETE · DECK GENERATED"}</span><h2>{result.game.title}</h2><p>A sourced proposal for {result.prospect.name}, {result.prospect.title} at {result.company.name}, built from {result.evidence.length} evidence records.</p>{cacheMeta&&<em className="cacheStamp"><Database size={11}/> Pulled from verified run · {new Date(cacheMeta.cachedAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</em>}</div>
        <div className="resultGrid"><div className="gameCard"><div className="gameVisual"><div className="stars">✦　·　✧<br/>　·　✦　 ·</div><div className="gameLogo">{initials}</div><span>MADE FOR {result.prospect.name.toUpperCase()}</span><h3>{result.game.title}</h3><a href={gamePath} target="_blank"><Play size={17} fill="currentColor"/> Play Deck experience</a></div></div>
          <div className="resultInfo"><div className="quality"><div><small>RESEARCH QUALITY</small><strong>{result.quality.score}<span>/100</span></strong></div><div className="qualityRing" style={{background:`conic-gradient(var(--lime) 0 ${result.quality.score}%,#282a24 ${result.quality.score}%)`}}><span>{result.quality.score}%</span></div></div><div className="why"><small>WHY THIS PERSON</small><p>{result.prospect.whyThisPerson}</p></div><div className="usedHooks"><small>EVIDENCED PERSONAL TOUCHES</small><div>{result.prospect.personalHooks.map(h=><span key={h}><Check size={11}/>{h}</span>)}</div></div><div className="shareBox"><div><small>GENERATED LIVE DECK</small><a href={gamePath} target="_blank">localhost:3000/api/game?config=…</a></div><button onClick={copy}>{copied?<Check size={17}/>:<Copy size={17}/>} {copied?"Copied":"Copy"}</button><a className="open" href={gamePath} target="_blank"><ExternalLink size={17}/></a></div></div></div>
        <section className="evidenceReceipt"><div><span>GROUNDING RECEIPT</span><b>{result.evidence.length} sources retained</b><button onClick={()=>setRawOpen(!rawOpen)}><Globe2 size={13}/>{rawOpen?"Hide":"Show"} evidence</button></div>{rawOpen&&<div className="receiptGrid">{result.evidence.map((e,i)=><article key={`${e.url}-${i}`}><small>{e.tier} · {e.source}</small><a href={e.url} target="_blank">{e.title}<ExternalLink size={11}/></a><p>{e.claim}</p>{e.quote&&<blockquote>“{e.quote}”</blockquote>}</article>)}</div>}</section>
        {result.quality.caveats.length>0&&<div className="caveats"><b>Human review notes</b>{result.quality.caveats.map(c=><span key={c}>{c}</span>)}</div>}
        <div className="doneActions"><button onClick={reset}><RotateCcw size={15}/> Research another company</button></div>
      </motion.section>}

      {phase==="error"&&<motion.section key="error" className="errorScreen" initial={{opacity:0}} animate={{opacity:1}}><ShieldCheck/><small>LIVE RUN STOPPED</small><h2>This is a real integration error—not a fake fallback.</h2><p>{error}</p><button onClick={reset}><RotateCcw size={15}/> Return to setup</button></motion.section>}
    </AnimatePresence>
  </main>
}
