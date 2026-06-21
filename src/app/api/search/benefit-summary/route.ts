import { NextResponse } from 'next/server';
import { z } from 'zod';
import { anthropic, CLAUDE_MODEL } from '@/lib/claude/client';
import { requireUser } from '@/lib/auth/requireUser';

const RequestSchema = z.object({
  programName: z.string().min(1),
  state: z.string().min(1),
  storedDescription: z.string().optional().default(''),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { programName, state, storedDescription } = parsed.data;

  const context = storedDescription
    ? `Additional context: "${storedDescription}"`
    : '';

  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      system:
        'You explain government benefit programs to parents of children with disabilities. ' +
        'Output only the explanation — no preamble, no "Here is", no introduction phrases.',
      messages: [
        {
          role: 'user',
          content:
            `Explain what "${programName}" is and how it helps families of children with disabilities in ${state}. ` +
            `${context} ` +
            `Cover: what the program provides, who qualifies, and how a parent would apply or get started. ` +
            `Keep it to 3–4 sentences. Write directly to the parent, in plain language.`,
        },
      ],
    });

    const text = message.content.find((b) => b.type === 'text');
    return NextResponse.json({ summary: text?.type === 'text' ? text.text : '' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
