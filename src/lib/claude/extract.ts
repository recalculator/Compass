import { anthropic, CLAUDE_MODEL } from './client';
import { extractJson } from './parse';
import type { ExtractedDocumentData } from '@/lib/types';

const EXTRACTION_SYSTEM_PROMPT = `You are a careful clinical-document reader helping a parent of a child with autism or other special needs make sense of paperwork (IEPs, evaluations, therapy notes). Read the attached document and extract structured facts. Be conservative: only include what the document actually states. Respond with ONLY a JSON object, no preamble, matching exactly this shape:

{
  "summary": "2-3 sentence plain-English summary of what this document is and what it says",
  "diagnoses": ["string", ...],
  "current_services": [{ "name": "string", "provider": "string or omit", "frequency": "string or omit" }],
  "goals": [{ "area": "string e.g. Communication", "goal": "string, the specific goal text" }],
  "recommendations": ["string", ...],
  "important_dates": [{ "label": "string e.g. Next IEP review", "date": "YYYY-MM-DD" }],
  "location": { "zip": "5-digit ZIP code", "city": "city name", "state": "2-letter state code" }
}

If a field has no data in the document, use an empty array (never omit the key). Dates must be ISO format YYYY-MM-DD; if you can't determine an exact date, skip that entry rather than guessing. For "location", look for any address block — child's home address, school letterhead, clinic address, or meeting location. If you find a ZIP code, include it. Omit "location" entirely (do not include the key) if no address information is present in the document.`;

export async function extractDocumentData(params: {
  base64: string;
  mediaType: string;
  documentType: string;
}): Promise<ExtractedDocumentData> {
  const { base64, mediaType, documentType } = params;
  const isPdf = mediaType === 'application/pdf';

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: EXTRACTION_SYSTEM_PROMPT,
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
          {
            type: 'text' as const,
            text: `This document is categorized as: ${documentType}. Extract the structured data as instructed.`,
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return extractJson<ExtractedDocumentData>(textBlock.text);
}
