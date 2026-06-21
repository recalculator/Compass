import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';

const annotationSchema = z.object({
  clarityRating: z.number().int().min(1).max(5),
  correctedSummary: z.string().trim().min(1).nullable(),
  notes: z.string().trim().min(1).nullable(),
});

export async function POST(request: Request, { params }: { params: { callNotesId: string } }) {
  const body = await request.json();
  const parsed = annotationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: callNotes } = await supabase
    .from('call_notes')
    .select('id, expert_call_request_id')
    .eq('id', params.callNotesId)
    .maybeSingle();

  if (!callNotes) {
    return NextResponse.json({ error: 'Call notes not found.' }, { status: 404 });
  }

  const { data: expertCallRequest } = await supabase
    .from('expert_call_requests')
    .select('terac_submission_id')
    .eq('id', callNotes.expert_call_request_id)
    .maybeSingle();

  const { error } = await supabase.from('annotations').insert({
    call_notes_id: callNotes.id,
    terac_submission_id: expertCallRequest?.terac_submission_id ?? null,
    clarity_rating: parsed.data.clarityRating,
    corrected_summary: parsed.data.correctedSummary,
    notes: parsed.data.notes,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
