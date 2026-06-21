import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/requireUser';
import { getCurrentChild } from '@/lib/child/getCurrentChild';
import { anthropic, CLAUDE_MODEL } from '@/lib/claude/client';
import { createServiceRoleClient } from '@/lib/supabase/server';

const Schema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1),
    }),
  ).min(1),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { user, supabase } = auth;

  const body = await request.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const profile = await getCurrentChild(supabase, user.id);
  if (!profile) return NextResponse.json({ error: 'No child profile found.' }, { status: 400 });

  const db = createServiceRoleClient();
  const { data: docs } = await db
    .from('documents')
    .select('file_name, document_type, extracted_data')
    .eq('child_id', profile.id)
    .eq('status', 'complete');

  const age = profile.birth_date
    ? `${Math.floor((Date.now() - new Date(profile.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} years old`
    : null;

  let context = `You are a knowledgeable, warm assistant helping a parent navigate their child's special needs journey.

Child: ${profile.child_name}${age ? `, ${age}` : ''}
Diagnosis: ${(profile.diagnosis ?? []).join(', ') || 'Not yet specified'}
Current services: ${(profile.current_services ?? []).join(', ') || 'None recorded'}
Location: ${[profile.location_city, profile.location_state, profile.location_zip].filter(Boolean).join(', ') || 'Not specified'}`;

  if (docs && docs.length > 0) {
    context += '\n\nUploaded documents and extracted information:\n';
    for (const doc of docs) {
      context += `\n--- ${doc.file_name} (${doc.document_type}) ---\n`;
      if (doc.extracted_data) {
        const d = doc.extracted_data as Record<string, unknown>;
        if (Array.isArray(d.diagnoses) && d.diagnoses.length) context += `Diagnoses: ${(d.diagnoses as string[]).join(', ')}\n`;
        if (Array.isArray(d.goals) && d.goals.length) {
          context += `Goals:\n`;
          for (const g of d.goals as { area: string; goal: string }[]) context += `  • ${g.area}: ${g.goal}\n`;
        }
        if (Array.isArray(d.recommendations) && d.recommendations.length) {
          context += `Recommendations:\n`;
          for (const r of d.recommendations as string[]) context += `  • ${r}\n`;
        }
        if (Array.isArray(d.important_dates) && d.important_dates.length) {
          context += `Key dates:\n`;
          for (const dt of d.important_dates as { label: string; date: string }[]) context += `  • ${dt.label}: ${dt.date}\n`;
        }
      }
    }
  }

  context += '\n\nAnswer questions clearly and in plain language. When relevant, reference the specific documents or data above. If you don\'t know something, say so honestly rather than guessing. You can help explain IEP terminology, suggest questions to ask at meetings, clarify diagnoses, or explain what services might help.';

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: context,
    messages: parsed.data.messages,
  });

  const text = message.content.find((b) => b.type === 'text');
  return NextResponse.json({ reply: text?.type === 'text' ? text.text : '' });
}
