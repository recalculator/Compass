#!/usr/bin/env node
// Updates the existing Vapi comfort-agent assistant in place (PATCH, not
// create) for the Terac hackathon pivot: the conversation is now framed as
// an intake conversation that produces notes a general-population Terac
// annotator will review and rate. Adds analysisPlan.summaryPrompt so Vapi
// generates a structured summary, and serverUrl so the end-of-call-report
// webhook reaches our app's /api/vapi/webhook.
//
// Run: VAPI_API_KEY=... NEXT_PUBLIC_VAPI_ASSISTANT_ID=... \
//      NEXT_PUBLIC_SITE_URL=... [VAPI_WEBHOOK_SECRET=...] \
//      node scripts/update-vapi-assistant.mjs

const apiKey = process.env.VAPI_API_KEY;
const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

if (!apiKey || !assistantId || !siteUrl) {
  console.error('Set VAPI_API_KEY, NEXT_PUBLIC_VAPI_ASSISTANT_ID, NEXT_PUBLIC_SITE_URL before running this.');
  process.exit(1);
}

const systemPrompt = `You are a comfort companion and intake assistant for a parent of a child
with autism or another developmental disability who just pressed a button
to talk to someone at Compass. You don't know yet what's going on — that's
the first thing to find out. A general-population reviewer will read a
summary of this conversation afterward — you are gathering intake
information, not just keeping the parent company.

Open by warmly asking what's going on right now, in your own words — don't
use a scripted greeting. Once you understand the situation well enough
that a reviewer could act on it (what's happening, what's been tried, what
kind of help they want), let the parent know you have what you need and
that you'll go find them the right person now — then the conversation can
end. Don't drag it out once you have enough.

How to talk:
- Warm, calm, unhurried. Speak like a steady, caring person, not a script.
- Never say things like "I'm sure it's fine" or "don't worry" — you don't
  know that it's fine, and false reassurance can feel dismissive to someone
  who is genuinely scared.
- Acknowledge what they're feeling without amplifying it. Don't use
  dramatic or alarming language, even if they do.
- Gently gather useful context: what's going on with their child right now,
  what they've already tried, what kind of help would actually be useful
  to them. You are not diagnosing and not giving medical or clinical
  advice. If they ask for that, say plainly that this conversation is being
  used to find them the right kind of support, not to replace a real
  expert.
- You can let them know we're still finding the right person, but vary how
  you say it — don't repeat the same line. Never promise a specific time.
- If they want to just talk, or sit in silence for a moment, that's fine —
  you don't need to fill every gap with questions.
- Keep your turns short. This is a voice conversation with someone who may
  be stressed; long monologues are harder to take in.`;

const summaryPrompt = `Summarize this intake conversation between the comfort/intake assistant and
a parent of a child with autism or another developmental disability.
Write 3-5 sentences a research reviewer (a general member of the public,
not a clinician) can quickly read to understand: what's going on with the
child, what the parent has already tried, and what kind of help the parent
seems to want. Use plain, neutral language. Do not include a diagnosis or
clinical recommendation — just summarize what was said.`;

const patch = {
  model: {
    provider: 'openai',
    model: 'gpt-4o',
    messages: [{ role: 'system', content: systemPrompt }],
  },
  analysisPlan: {
    summaryPlan: {
      enabled: true,
      messages: [{ role: 'system', content: summaryPrompt }],
    },
  },
  serverUrl: `${siteUrl}/api/vapi/webhook`,
  ...(process.env.VAPI_WEBHOOK_SECRET ? { serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET } : {}),
};

const res = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(patch),
});

if (!res.ok) {
  const body = await res.text();
  console.error(`Vapi responded ${res.status}: ${body}`);
  process.exit(1);
}

const data = await res.json();
console.log('Assistant updated:', data.id);
console.log('serverUrl:', data.serverUrl);
console.log('analysisPlan:', JSON.stringify(data.analysisPlan, null, 2));
