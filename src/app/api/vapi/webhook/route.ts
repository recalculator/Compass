import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { createOpportunity, launchOpportunity } from '@/lib/terac/client';
import { buildScreeningQuestions } from '@/lib/terac/screening';

const MODEL_VERSION = 'v1_baseline';
const TASK_DURATION_MINUTES = 30;
const CLAIM_TIMEOUT_MINUTES = 10;

export async function POST(request: Request) {
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  if (secret && request.headers.get('x-vapi-secret') !== secret) {
    return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 });
  }

  const body = await request.json();
  const message = body?.message;

  if (message?.type !== 'end-of-call-report') {
    return NextResponse.json({ ok: true });
  }

  // The web SDK's vapi.start(assistantId, { metadata }) call actually lands
  // the value under call.assistantOverrides.metadata, not call.metadata —
  // confirmed against a real call via the Vapi API. Check both.
  const expertCallRequestId: string | undefined =
    message.call?.metadata?.expertCallRequestId ??
    message.call?.assistantOverrides?.metadata?.expertCallRequestId;
  const summary: string | undefined = message.analysis?.summary;

  if (!expertCallRequestId || !summary) {
    console.error('[vapi/webhook] end-of-call-report missing metadata or summary', {
      hasMetadata: Boolean(expertCallRequestId),
      hasSummary: Boolean(summary),
    });
    return NextResponse.json({ ok: true });
  }

  const supabase = createServiceRoleClient();

  const { error: callNotesError } = await supabase.from('call_notes').insert({
    expert_call_request_id: expertCallRequestId,
    ai_generated_summary: summary,
    model_version: MODEL_VERSION,
  });

  if (callNotesError) {
    console.error('[vapi/webhook] failed to insert call_notes:', callNotesError);
    return NextResponse.json({ error: callNotesError.message }, { status: 500 });
  }

  // The intake conversation just produced the only "topic" we have — back
  // it onto the request row, then use it to actually create and launch the
  // Terac opportunity. This couldn't happen earlier: there's no topic until
  // the call ends and this summary exists.
  const opportunityParams = {
    title: 'Review an AI-generated intake summary',
    internal_title: `Compass annotation task — request ${expertCallRequestId}`,
    description: summary,
    project_id: process.env.TERAC_PROJECT_ID!,
    num_participants: 1,
    business_type: 'b2c' as const,
    expected_days_to_complete: 5,
    screening_questions: buildScreeningQuestions(),
    tasks: [
      {
        sequence: 1,
        task_type: 'activity' as const,
        review_type: 'manual_review' as const,
        task_url: `${process.env.NEXT_PUBLIC_SITE_URL}/annotate/${expertCallRequestId}`,
        duration_minutes: TASK_DURATION_MINUTES,
        title: 'Review an AI-generated intake summary',
        description: summary,
      },
    ],
  };

  const opportunityResult = await createOpportunity(opportunityParams);
  if (!opportunityResult.ok) {
    console.error('[vapi/webhook] createOpportunity failed:', opportunityResult.error);
    await supabase
      .from('expert_call_requests')
      .update({ topic: summary, status: 'failed', error_message: opportunityResult.error })
      .eq('id', expertCallRequestId);
    return NextResponse.json({ ok: true });
  }

  const launchResult = await launchOpportunity(opportunityResult.data);
  if (!launchResult.ok) {
    console.error('[vapi/webhook] launchOpportunity failed:', launchResult.error);
    await supabase
      .from('expert_call_requests')
      .update({
        topic: summary,
        status: 'failed',
        error_message: launchResult.error,
        terac_opportunity_id: opportunityResult.data.id,
      })
      .eq('id', expertCallRequestId);
    return NextResponse.json({ ok: true });
  }

  const claimTimeoutAt = new Date(Date.now() + CLAIM_TIMEOUT_MINUTES * 60 * 1000).toISOString();

  await supabase
    .from('expert_call_requests')
    .update({
      topic: summary,
      status: 'launched',
      terac_opportunity_id: opportunityResult.data.id,
      claim_timeout_at: claimTimeoutAt,
    })
    .eq('id', expertCallRequestId);

  return NextResponse.json({ ok: true });
}
