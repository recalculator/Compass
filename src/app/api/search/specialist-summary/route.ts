import { NextResponse } from 'next/server';
import { z } from 'zod';
import { anthropic, CLAUDE_MODEL } from '@/lib/claude/client';
import { requireUser } from '@/lib/auth/requireUser';

const RequestSchema = z.object({
  name: z.string().min(1),
  specialty: z.string().min(1),
  address: z.string().optional().default(''),
  description: z.string().optional().default(''),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { name, specialty, address, description } = parsed.data;

  const context = description
    ? `Their bio says: "${description}"`
    : `They are a ${specialty} provider located in ${address || 'your area'}. You may not have specific details about this individual — draw reasonable inferences based on what a dedicated ${specialty} specialist typically brings.`;

  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      system:
        'You write direct, concise provider summaries for parents. ' +
        'Output only the summary — no preamble, no "Here is", no introduction phrases, no sign-off.',
      messages: [
        {
          role: 'user',
          content:
            `Write 2–3 sentences about ${name} specifically — their experience, background, or approach — ` +
            `that would help a parent decide whether to choose them over another ${specialty} provider. ` +
            `${context} ` +
            `Focus on what makes this provider stand out: years of experience, population they work with, their treatment style, or notable credentials. ` +
            `Do not explain what ${specialty} therapy is in general. Write directly to the parent.`,
        },
      ],
    });

    const text = message.content.find((b) => b.type === 'text');
    return NextResponse.json({ summary: text?.type === 'text' ? text.text : '' });
  } catch (err) {
    console.error('[/api/search/specialist-summary]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
