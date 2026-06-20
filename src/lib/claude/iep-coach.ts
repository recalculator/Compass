import { anthropic, CLAUDE_MODEL } from './client';

export type IepSection = {
  section_title: string;
  plain_english: string;
  flag: { level: 'concern' | 'question' | null; note: string | null };
};

export type IepAnalysis = {
  overview: string;
  sections: IepSection[];
  questions_to_ask: string[];
};

function extractJson<T>(text: string): T {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Claude did not return JSON');
  return JSON.parse(text.slice(start, end + 1)) as T;
}

const SYSTEM_PROMPT = `You are an expert IEP (Individualized Education Program) advocate helping a parent understand their child's IEP document. You know IDEA law, FAPE, LRE, and common pitfalls school districts use that disadvantage students. Read the attached IEP and:

1. Walk through each major section and explain it in warm, plain English a non-expert parent can understand.
2. Flag anything vague, weak, non-measurable, non-compliant, or that the parent should question or push back on (e.g. goals without measurable criteria, insufficient service minutes, missing accommodations, vague present levels, lack of data).
3. Generate a list of specific questions the parent should bring to their next IEP meeting, based on THIS document.

Respond with ONLY a JSON object, no preamble, in this shape:
{
  "overview": "2-3 sentence plain-English summary of the whole document",
  "sections": [
    {
      "section_title": "string, e.g. Present Levels of Performance",
      "plain_english": "explanation a parent can understand",
      "flag": { "level": "concern" | "question" | null, "note": "why this should be flagged, or null if no flag" }
    }
  ],
  "questions_to_ask": ["string", ...]
}`;

export async function analyzeIep(params: {
  base64: string;
  mediaType: string;
}): Promise<IepAnalysis> {
  const { base64, mediaType } = params;
  const isPdf = mediaType === 'application/pdf';

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          isPdf
            ? {
                type: 'document' as const,
                source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: base64 },
              }
            : {
                type: 'image' as const,
                source: {
                  type: 'base64' as const,
                  media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp',
                  data: base64,
                },
              },
          { type: 'text' as const, text: 'Analyze this IEP as instructed.' },
        ],
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') throw new Error('No text response from Claude');

  return extractJson<IepAnalysis>(textBlock.text);
}
