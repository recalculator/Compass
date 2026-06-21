import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/requireUser';
import { getCurrentChild } from '@/lib/child/getCurrentChild';
import { createCallRoom } from '@/lib/daily/client';
import { createOpportunity, launchOpportunity } from '@/lib/terac/client';
import { buildHealthcareProviderFilters, buildScreeningQuestions } from '@/lib/terac/screening';

const requestSchema = z.object({
  topic: z.string().trim().min(1, 'Tell us what you need help with.').max(1000),
});

const CALL_DURATION_MINUTES = 30;
const ROOM_EXPIRY_MINUTES = 120;

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { user, supabase } = auth;

  const body = await request.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const { topic } = parsed.data;

  const child = await getCurrentChild(supabase, user.id);

  const { data: row, error: insertError } = await supabase
    .from('expert_call_requests')
    .insert({ user_id: user.id, child_id: child?.id ?? null, topic, status: 'pending' })
    .select('id')
    .single();

  if (insertError || !row) {
    return NextResponse.json({ error: insertError?.message ?? 'Could not create request.' }, { status: 500 });
  }

  const requestId = row.id as string;

  const roomResult = await createCallRoom({
    expertCallRequestId: requestId,
    expiresInMinutes: ROOM_EXPIRY_MINUTES,
  });

  if (!roomResult.ok) {
    await supabase
      .from('expert_call_requests')
      .update({ status: 'failed', error_message: roomResult.error })
      .eq('id', requestId);
    return NextResponse.json({ error: roomResult.error }, { status: 500 });
  }

  const opportunityResult = await createOpportunity({
    title: 'Live parent consult: special needs support',
    internal_title: `Compass live consult — request ${requestId}`,
    description: topic,
    project_id: process.env.TERAC_PROJECT_ID!,
    num_participants: 3,
    business_type: 'b2c',
    expected_days_to_complete: 5,
    filters: buildHealthcareProviderFilters(),
    screening_questions: buildScreeningQuestions(),
    tasks: [
      {
        sequence: 1,
        task_type: 'interview',
        review_type: 'manual_review',
        task_url: roomResult.roomUrl,
        duration_minutes: CALL_DURATION_MINUTES,
        title: 'Live video consult',
        description: topic,
      },
    ],
  });

  if (!opportunityResult.ok) {
    await supabase
      .from('expert_call_requests')
      .update({
        status: 'failed',
        error_message: opportunityResult.error,
        room_url: roomResult.roomUrl,
        room_name: roomResult.roomName,
      })
      .eq('id', requestId);
    return NextResponse.json({ error: opportunityResult.error }, { status: 500 });
  }

  const launchResult = await launchOpportunity(opportunityResult.data.id);
  if (!launchResult.ok) {
    await supabase
      .from('expert_call_requests')
      .update({
        status: 'failed',
        error_message: launchResult.error,
        room_url: roomResult.roomUrl,
        room_name: roomResult.roomName,
        terac_opportunity_id: opportunityResult.data.id,
      })
      .eq('id', requestId);
    return NextResponse.json({ error: launchResult.error }, { status: 500 });
  }

  await supabase
    .from('expert_call_requests')
    .update({
      status: 'launched',
      room_url: roomResult.roomUrl,
      room_name: roomResult.roomName,
      terac_opportunity_id: opportunityResult.data.id,
    })
    .eq('id', requestId);

  return NextResponse.json({ requestId });
}
