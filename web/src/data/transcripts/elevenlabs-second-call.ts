/**
 * Fictional call transcript — v1 demo input for the ingestion pipeline.
 *
 * Deliberately seeded so every field the agent writes has evidence somewhere in
 * the dialogue, and nothing the agent writes is inferable from the CRM alone:
 *
 *   Stage           SQL → Sales Qualified Opportunity (proposal + buyer agreed)
 *   Headcount       180 → 214 (Saoirse corrects it out loud)
 *   ARR             €43,200 → €59,064 (214 × €276, derived from quoted pricing)
 *   Products        + Dental (candidates ask for it)
 *   Tom sentiment   Sceptical → Neutral (softens, does not convert)
 *   Saoirse         stays Positive
 *   Aspirations     both refined by what they say, not what LinkedIn said
 *   New stakeholder Ravi Menon, VP Finance — economic buyer, absent from CRM
 *   Competitors     Bupa, Vitality, Gallagher / Google, Meta, OpenAI, Anthropic
 */

export interface Utterance {
  /** mm:ss from start of call. */
  t: string;
  speaker: string;
  text: string;
}

export interface Transcript {
  id: string;
  title: string;
  /** ISO date the call took place. */
  date: string;
  durationMinutes: number;
  source: "manual" | "fireflies" | "granola";
  attendees: { name: string; org: string; email?: string }[];
  utterances: Utterance[];
}

export const elevenLabsSecondCall: Transcript = {
  id: "elevenlabs-second-call-2026-08-15",
  title: "Kota <> ElevenLabs — second call",
  date: "2026-08-15",
  durationMinutes: 24,
  source: "manual",
  attendees: [
    { name: "George Kelly", org: "Kota", email: "george.kelly@kota.io" },
    {
      name: "Tom Ashworth",
      org: "ElevenLabs",
      email: "tom.ashworth@elevenlabs.io",
    },
    {
      name: "Saoirse Byrne",
      org: "ElevenLabs",
      email: "saoirse.byrne@elevenlabs.io",
    },
  ],
  utterances: [
    {
      t: "00:04",
      speaker: "George Kelly",
      text: "Morning both. Tom, Saoirse — thanks for making the time again. I know last time we spent most of it on slides, so I've not brought any.",
    },
    {
      t: "00:13",
      speaker: "Tom Ashworth",
      text: "Good. I'll be straight with you, George, I nearly cancelled this. I sat through the first call and I still couldn't tell you what the product actually does versus what a broker does.",
    },
    {
      t: "00:26",
      speaker: "George Kelly",
      text: "That's fair, and it's on me. So let's do it the other way round — I'll share my screen, we'll go into the actual admin view, and you tell me where it falls over.",
    },
    {
      t: "00:36",
      speaker: "Tom Ashworth",
      text: "Right. That I'll take.",
    },
    {
      t: "00:40",
      speaker: "Saoirse Byrne",
      text: "Before you do — George, can I give you the context from my side, because it's got worse since we spoke.",
    },
    { t: "00:47", speaker: "George Kelly", text: "Please." },
    {
      t: "00:49",
      speaker: "Saoirse Byrne",
      text: "We lost a senior research engineer on Thursday. Final round, verbal yes, and then she went to Anthropic. When I did the exit call the reason was the package — not base, the package. Their health cover includes her partner and ours doesn't. That's the second one this quarter. I lost one to Google in June on more or less the same thing.",
    },
    {
      t: "01:14",
      speaker: "Tom Ashworth",
      text: "To be fair, we don't lose most of them on benefits.",
    },
    {
      t: "01:18",
      speaker: "Saoirse Byrne",
      text: "No, we lose them on benefits at the very end, which is the expensive place to lose them. By final round I've spent six weeks and an engineering panel on that person. Meta and OpenAI are both in every one of my final rounds now and they all lead with the same three things.",
    },
    {
      t: "01:35",
      speaker: "George Kelly",
      text: "What are the three things?",
    },
    {
      t: "01:37",
      speaker: "Saoirse Byrne",
      text: "Health cover that includes family, dental, and something that makes the pension feel real. I get asked about dental in probably half my final rounds now and I have to say we don't do it. It's a small thing that sounds bad out loud.",
    },
    {
      t: "01:53",
      speaker: "George Kelly",
      text: "Noted — dental wasn't in the scope we talked about last time. I'll come back to that. Tom, let me share.",
    },
    {
      t: "02:01",
      speaker: "Tom Ashworth",
      text: "Go. And I want to see three things: how an employee is added, what happens to the data, and whether I can get it out again.",
    },
    {
      t: "02:12",
      speaker: "George Kelly",
      text: "So this is the admin view. Every employee sits here with whatever cover they're on. When someone joins, you don't email anyone — they land in here, they get a link, they choose their own cover within the policy you've set, and the insurer is notified automatically.",
    },
    {
      t: "02:31",
      speaker: "Tom Ashworth",
      text: "Stop there. Who creates the employee record? Because if the answer is 'you type it in', we're already doing that twice.",
    },
    {
      t: "02:40",
      speaker: "George Kelly",
      text: "You're on HiBob, right? It syncs. New starter in HiBob appears here, leaver in HiBob comes off cover here. You don't touch it twice.",
    },
    {
      t: "02:50",
      speaker: "Tom Ashworth",
      text: "Both directions, or just in?",
    },
    {
      t: "02:53",
      speaker: "George Kelly",
      text: "Employee data in, benefits data back out. So HiBob stays your source of truth for people, we're the source of truth for cover.",
    },
    {
      t: "03:03",
      speaker: "Tom Ashworth",
      text: "And the API — is it a real API or is it a CSV export you're calling an API?",
    },
    {
      t: "03:10",
      speaker: "George Kelly",
      text: "Real one. There's a full REST API, and we've got an embedded product on top of it. I can send you the docs and you can judge it yourself rather than take my word.",
    },
    {
      t: "03:21",
      speaker: "Tom Ashworth",
      text: "I will. Send them. Honestly, this is why I push on this stuff — I've built internal tools for exactly this at my last two companies, and I've got a doc somewhere arguing we should just build it ourselves.",
    },
    {
      t: "03:36",
      speaker: "George Kelly",
      text: "How far did you get with that?",
    },
    {
      t: "03:39",
      speaker: "Tom Ashworth",
      text: "Far enough to work out the hard part isn't the software, it's being regulated. I'm not getting an insurance licence to save Saoirse a spreadsheet. But I'm going to leave and start something eventually, so I look at every vendor as 'could I build this' — occupational hazard.",
    },
    {
      t: "03:57",
      speaker: "George Kelly",
      text: "That's the right instinct on this one, for what it's worth. Building it is the cheap bit.",
    },
    {
      t: "04:04",
      speaker: "Tom Ashworth",
      text: "So talk to me about what it replaces. Right now we're with Bupa through Gallagher, and Gallagher does the admin. What do I stop paying for?",
    },
    {
      t: "04:15",
      speaker: "George Kelly",
      text: "You keep an insurer — that could still be Bupa, or Vitality, we'll quote both. What goes away is the broker sitting in the middle of every change and the mailbox that Saoirse's team runs.",
    },
    {
      t: "04:28",
      speaker: "Saoirse Byrne",
      text: "That mailbox is genuinely two days a month of my life. Adding people, taking people off, someone's partner, someone moving to Dublin.",
    },
    {
      t: "04:38",
      speaker: "Tom Ashworth",
      text: "Fine. But Gallagher's fee is baked into the premium and I've never seen it as a line item. So what I actually need is a per-head number I can put next to what we pay today, or I can't have the conversation internally.",
    },
    {
      t: "04:53",
      speaker: "George Kelly",
      text: "Then let's get the headcount right first, because I've got 180 written down for London.",
    },
    {
      t: "05:00",
      speaker: "Saoirse Byrne",
      text: "That's out of date, sorry. London's 214 as of the start of this month. We closed the research hiring push in July. It'll be past 230 by Christmas if the current plan holds.",
    },
    {
      t: "05:14",
      speaker: "George Kelly",
      text: "Good, that changes it slightly in your favour. For the health and cash plan bundle we talked about, at your size, it's twenty euro per employee per month. That's the number to hold in your head.",
    },
    {
      t: "05:27",
      speaker: "Tom Ashworth",
      text: "Twenty a head, all in?",
    },
    {
      t: "05:30",
      speaker: "George Kelly",
      text: "For health and the cash plan, yes. Dental is an add-on — three euro per employee per month on top. So if you took all three you're at twenty-three per head per month.",
    },
    {
      t: "05:43",
      speaker: "Saoirse Byrne",
      text: "Add the dental. Three euro to stop me saying 'no we don't have that' in a final round is nothing.",
    },
    {
      t: "05:51",
      speaker: "Tom Ashworth",
      text: "You don't get to spend money in this meeting, Saoirse.",
    },
    {
      t: "05:55",
      speaker: "Saoirse Byrne",
      text: "I'm aware. I'm saying put it in the proposal so Ravi can see what it costs.",
    },
    {
      t: "06:02",
      speaker: "George Kelly",
      text: "Ravi being?",
    },
    {
      t: "06:04",
      speaker: "Tom Ashworth",
      text: "Ravi Menon, our VP Finance. He signs anything recurring over fifty thousand a year, and by the sound of it this is going to be right on that line. I can push it, but I can't approve it on my own.",
    },
    {
      t: "06:19",
      speaker: "George Kelly",
      text: "Understood. Then I'd rather build the proposal for him than for you, if that's alright. What does Ravi care about?",
    },
    {
      t: "06:28",
      speaker: "Tom Ashworth",
      text: "Total cost versus this year, and he'll want to see the Gallagher fee unpicked. He'll assume we're adding cost. If the answer is 'it's roughly flat and you get dental and you stop losing candidates', that lands. If it's 'it's forty percent more', it dies.",
    },
    {
      t: "06:47",
      speaker: "Saoirse Byrne",
      text: "It should also say what a lost final-round candidate costs us. That's a real number and nobody ever writes it down.",
    },
    {
      t: "06:56",
      speaker: "George Kelly",
      text: "I'll put it in. So — proposal covering 214 employees in London, health, cash plan and dental, per-head against your current Bupa arrangement, with the broker fee separated out. Anything else in it?",
    },
    {
      t: "07:12",
      speaker: "Tom Ashworth",
      text: "The API docs, separately, to me. And I want the implementation timeline in the proposal, not verbally. If this takes a quarter to switch on, that's a different decision.",
    },
    {
      t: "07:24",
      speaker: "George Kelly",
      text: "It's about three weeks from signature, and I'll write it down. When can I get you and Ravi in a room?",
    },
    {
      t: "07:32",
      speaker: "Tom Ashworth",
      text: "Get me the proposal by Tuesday and I'll get him on a call the week after. He's out the back half of next week.",
    },
    {
      t: "07:41",
      speaker: "George Kelly",
      text: "Tuesday it is. And Tom — has this moved you at all, or are you still where you were at the start?",
    },
    {
      t: "07:49",
      speaker: "Tom Ashworth",
      text: "I'm less sceptical than I was an hour ago. The HiBob sync is the bit that matters to me and I didn't know it existed. I'm not sold — I want to read the API docs and I want Ravi's view on the number. But it's a real product and I'll stop calling it a broker with a website.",
    },
    {
      t: "08:09",
      speaker: "George Kelly",
      text: "I'll take that. Saoirse, anything you need before Tuesday?",
    },
    {
      t: "08:14",
      speaker: "Saoirse Byrne",
      text: "Just something I can put in front of a candidate. One page, what the package actually is. I've got two offers going out the week after next and I'd love to lead with it rather than apologise for it.",
    },
    {
      t: "08:28",
      speaker: "George Kelly",
      text: "You'll have it with the proposal. Thanks both.",
    },
  ],
};
