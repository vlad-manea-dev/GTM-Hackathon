"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Bot, BriefcaseBusiness, Check, CheckCircle2, ChevronDown, CircleUserRound, ContactRound, Copy, Database, ExternalLink, FileAudio, Globe2, Mic2, Play, Radio, RotateCcw, Search, ShieldCheck, Sparkles, UsersRound, WandSparkles, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PipelineNav } from "./components/PipelineNav";
import "./result-links.css";

type Account = "ElevenLabs" | "Synthesia";
type Phase = "setup" | "running" | "done";

const accounts = {
  ElevenLabs: {
    domain: "elevenlabs.io", initials: "11", person: "Victoria Weller", role: "Operations · People & Talent", score: 96,
    game: "The Invisible Orbit", gamePath: "/g/elevenlabs/",
    why: "Scaling a remote-first global team while keeping People operations lean and invisible.",
    hooks: ["Astrophysics → operations", "Rainy London bus insight", "The invisible ops philosophy", "Soccer defense metaphor"],
    findings: [
      {source:"Aviato", icon:"database", label:"Identity resolved", detail:"Operations leader · current role verified", tier:"Company graph"},
      {source:"ElevenLabs Careers", icon:"globe", label:"Benefits owner signal", detail:"People Ops owns benefits, HiBob and Deel", tier:"First-party"},
      {source:"Scaling Europe", icon:"mic", label:"Podcast transcript", detail:"Scaled operations from 10 → 400 people", tier:"First-person"},
      {source:"LinkedIn", icon:"linkedin", label:"Personal philosophy", detail:"“The best ops teams work hard to go unnoticed.”", tier:"First-person"},
      {source:"Strange Ventures", icon:"audio", label:"Distinctive story", detail:"A rainy London bus made ubiquitous voice click", tier:"Interview"},
      {source:"Market scan", icon:"search", label:"Pain hypothesis", detail:"Global benefits complexity without bureaucracy", tier:"Deep research"},
    ]
  },
  Synthesia: {
    domain: "synthesia.io", initials: "S", person: "Aarti Tanna", role: "People Operations Lead", score: 94,
    game: "The Human Global System", gamePath: "/g/synthesia/",
    why: "Building People systems that work for humans across expanding global locations.",
    hooks: ["Ownership · Autonomy · Trust", "Challenge the old way", "Berlin · Paris · Austin", "Employee-feedback obsessed"],
    findings: [
      {source:"Aviato", icon:"database", label:"Buyer discovered", detail:"People Operations Lead · current role verified", tier:"Company graph"},
      {source:"Synthesia Careers", icon:"globe", label:"Expansion signal", detail:"70+ roles across a growing global workforce", tier:"First-party"},
      {source:"LinkedIn", icon:"linkedin", label:"Operating principle", detail:"“High Ownership. High Autonomy. High Trust.”", tier:"First-person"},
      {source:"People team post", icon:"users", label:"Pain evidence", detail:"Relocations, systems and compliance across countries", tier:"First-person"},
      {source:"Console case study", icon:"audio", label:"Stack signal", detail:"People playbooks, automation and HiBob", tier:"Third-party"},
      {source:"Market scan", icon:"search", label:"Value intersection", detail:"One global system, human local experience", tier:"Deep research"},
    ]
  }
} as const;

const Icon = ({name}:{name:string}) => {
  const C = name === "database" ? Database : name === "globe" ? Globe2 : name === "linkedin" ? ContactRound : name === "mic" ? Mic2 : name === "users" ? UsersRound : name === "search" ? Search : FileAudio;
  return <C size={16}/>;
};

export default function Home(){
  const [account,setAccount]=useState<Account>("ElevenLabs");
  const [phase,setPhase]=useState<Phase>("setup");
  const [step,setStep]=useState(0);
  const [elapsed,setElapsed]=useState(0);
  const [copied,setCopied]=useState(false);
  const data=accounts[account];
  const steps=useMemo(()=>[
    {label:"Resolving account & buying committee", source:"Aviato people + company graph"},
    {label:"Ingesting first-party intelligence", source:"CRM calls · notes · transcripts"},
    {label:"Mapping company pain & timing", source:"Careers · funding · stack · hiring"},
    {label:"Mining the prospect's own words", source:"Podcasts · posts · interviews"},
    {label:"Verifying claims & creative hooks", source:"Evidence agent · safety checks"},
    {label:"Composing & deploying the game", source:"Game agent · instant hosting"},
  ],[]);

  useEffect(()=>{
    if(phase!=="running") return;
    const started=Date.now();
    const ticker=setInterval(()=>setElapsed((Date.now()-started)/1000),50);
    const timers=steps.map((_,i)=>setTimeout(()=>setStep(i+1),i*2500+700));
    const done=setTimeout(()=>setPhase("done"),16000);
    return()=>{clearInterval(ticker);timers.forEach(clearTimeout);clearTimeout(done)};
  },[phase,steps]);

  const launch=()=>{setStep(0);setElapsed(0);setCopied(false);setPhase("running")};
  const reset=()=>{setPhase("setup");setStep(0);setElapsed(0)};
  const copy=async()=>{try{await navigator.clipboard.writeText(`${window.location.origin}${data.gamePath}`)}catch{}setCopied(true);setTimeout(()=>setCopied(false),1800)};

  return <main>
    <header className="topbar"><div className="brand"><span>y</span>yonder</div><PipelineNav/><div className="agentLive"><i/> research agent online</div><div className="demoTag">LIVE DEMO</div><button className="avatar">GK</button></header>
    <AnimatePresence mode="wait">
      {phase==="setup"&&<motion.section key="setup" className="setupScreen" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,y:-20}}>
        <div className="setupIntro"><div className="kicker"><Sparkles size={14}/> GIFT-GAME GENERATOR</div><h1>Research that becomes<br/><em>impossible-to-ignore outreach.</em></h1><p>Give us a company. We find the right person, learn what matters to them, and deploy a custom game your rep can send immediately.</p></div>
        <div className="launchPanel">
          <div className="panelHead"><div><small>NEW EXPERIENCE</small><strong>Who are we building for?</strong></div><button className="autofill"><WandSparkles size={14}/> AI pre-filled</button></div>
          <div className="inputGrid">
            <div className="inputCard"><label>SELLER</label><div className="accountRow"><div className="logo kota">K</div><div><b>Kota</b><span>kota.io · Benefits infrastructure</span></div><CheckCircle2 size={18}/></div></div>
            <div className="arrowCell"><ArrowRight size={18}/></div>
            <div className="inputCard selector"><label>TARGET ACCOUNT</label><button onClick={()=>setAccount(account==="ElevenLabs"?"Synthesia":"ElevenLabs")}><div className={`logo ${account==="ElevenLabs"?"eleven":"synthesia"}`}>{data.initials}</div><div><b>{account}</b><span>{data.domain} · AI scale-up</span></div><ChevronDown size={17}/></button></div>
          </div>
          <div className="scope"><div><BriefcaseBusiness size={16}/><span><b>Buying persona</b>Global benefits decision-maker</span></div><div><ShieldCheck size={16}/><span><b>Research mode</b>Public professional evidence only</span></div></div>
          <button className="primary" onClick={launch}><Zap size={18} fill="currentColor"/> Research & build their game <ArrowUpRight size={18}/></button>
        </div>
        <div className="sourceStrip"><span>POWERED BY</span><b>Aviato</b><i/><b>Unify</b><i/><b>Call transcripts</b><i/><b>OpenAI deep research</b><i/><b>Public web</b></div>
      </motion.section>}

      {phase==="running"&&<motion.section key="running" className="runScreen" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
        <div className="runHeader"><div><div className="crumb">KOTA <span>/</span> {account.toUpperCase()}</div><h2>Building a game for <em>{data.person}</em></h2></div><div className="timer"><small>ELAPSED</small><b>{Math.min(elapsed,16).toFixed(1)}s</b></div></div>
        <div className="pipeline">
          <aside className="stages">
            {steps.map((s,i)=><div className={`stage ${i<step?"complete":i===step?"active":""}`} key={s.label}><div className="stageDot">{i<step?<Check size={13}/>:i+1}</div><div><b>{s.label}</b><span>{s.source}</span></div>{i===step&&<motion.i layoutId="activeGlow"/>}</div>)}
          </aside>
          <section className="researchCanvas">
            <div className="canvasTop"><span><Radio size={14}/> LIVE EVIDENCE STREAM</span><b>{Math.min(step,data.findings.length)} / {data.findings.length} signals verified</b></div>
            <div className="orbit"><motion.div className="agentCore" animate={{boxShadow:["0 0 20px rgba(216,255,97,.12)","0 0 70px rgba(216,255,97,.35)","0 0 20px rgba(216,255,97,.12)"]}} transition={{duration:2,repeat:Infinity}}><Bot size={26}/><span>RESEARCH<br/>AGENT</span></motion.div><div className="ring ring1"/><div className="ring ring2"/></div>
            <div className="evidenceGrid">
              <AnimatePresence>{data.findings.slice(0,step).map((f,i)=><motion.article className={`evidence e${i}`} key={f.label} initial={{opacity:0,scale:.78,y:15}} animate={{opacity:1,scale:1,y:0}} transition={{type:"spring",stiffness:220,damping:18}}><div className="evidenceTop"><span className="sourceIcon"><Icon name={f.icon}/></span><small>{f.source}</small><CheckCircle2 size={14}/></div><b>{f.label}</b><p>{f.detail}</p><span className="tier">{f.tier}</span></motion.article>)}</AnimatePresence>
            </div>
            <AnimatePresence>{step>0&&step<6&&<motion.div className="scanMessage" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} key={step}><span className="scanLine"/><Sparkles size={15}/> {steps[Math.min(step,5)].label}…</motion.div>}</AnimatePresence>
          </section>
          <aside className="intelPanel"><div className="intelTitle"><CircleUserRound size={17}/> PROSPECT PROFILE</div><div className="personMini"><div className="personAvatar">{data.person.split(" ").map(x=>x[0]).join("")}</div><b>{data.person}</b><span>{data.role}</span></div><div className="confidence"><span>Identity confidence</span><b>{step>0?"98%":"—"}</b><div><motion.i animate={{width:step>0?"98%":"0%"}}/></div></div><div className="hookList"><small>CREATIVE SIGNALS</small>{data.hooks.map((h,i)=><motion.div key={h} animate={{opacity:step>i+1?1:.2,x:step>i+1?0:4}}><Sparkles size={12}/>{step>i+1?h:"Scanning…"}</motion.div>)}</div></aside>
        </div>
      </motion.section>}

      {phase==="done"&&<motion.section key="done" className="doneScreen" initial={{opacity:0}} animate={{opacity:1}}>
        <motion.div className="successOrb" initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",delay:.1}}><Check size={30}/></motion.div>
        <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:.2}} className="doneIntro"><span>RESEARCH COMPLETE · GAME DEPLOYED</span><h2>{data.game}</h2><p>A personalised proposal for {data.person} at {account}, built from {data.findings.length} verified signals across first- and third-party sources.</p></motion.div>
        <div className="resultGrid">
          <motion.div className="gameCard" initial={{opacity:0,x:-25}} animate={{opacity:1,x:0}} transition={{delay:.35}}><div className="gameVisual"><div className="stars">✦　·　✧<br/>　·　✦　 ·</div><div className="gameLogo">{account==="ElevenLabs"?"11":"S"}</div><span>MADE FOR {data.person.toUpperCase()}</span><h3>{data.game}</h3><a href={data.gamePath} target="_blank"><Play size={17} fill="currentColor"/> Play experience</a></div></motion.div>
          <motion.div className="resultInfo" initial={{opacity:0,x:25}} animate={{opacity:1,x:0}} transition={{delay:.42}}><div className="quality"><div><small>RESEARCH QUALITY</small><strong>{data.score}<span>/100</span></strong></div><div className="qualityRing"><span>{data.score}%</span></div></div><div className="why"><small>WHY THIS WILL LAND</small><p>{data.why}</p></div><div className="usedHooks"><small>PERSONAL TOUCHES USED</small><div>{data.hooks.map(h=><span key={h}><Check size={11}/>{h}</span>)}</div></div><div className="shareBox"><div><small>LIVE LOCAL GAME</small><a href={data.gamePath} target="_blank">localhost:3000{data.gamePath}</a></div><button onClick={copy}>{copied?<Check size={17}/>:<Copy size={17}/>} {copied?"Copied":"Copy"}</button><a className="open" href={data.gamePath} target="_blank" aria-label={`Open ${data.game} game`}><ExternalLink size={17}/></a></div></motion.div>
        </div>
        <div className="doneActions"><button onClick={reset}><RotateCcw size={15}/> Run another account</button><button className="send">Add to sequence <ArrowUpRight size={16}/></button></div>
      </motion.section>}
    </AnimatePresence>
  </main>
}
