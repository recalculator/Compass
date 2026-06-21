import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { approveSubmission, listSubmissions } from '@/lib/terac/client';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { supabase } = auth;

  const { data: row, error } = await supabase
    .from('expert_call_requests')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
  }

  if (row.status === 'scheduled' || row.status === 'failed' || row.status === 'cancelled' || row.status === 'timed_out') {
    return NextResponse.json({
      status: row.status,
      roomUrl: row.status === 'scheduled' ? row.room_url : null,
      error: row.error_message,
    });
  }

  if (!row.terac_opportunity_id) {
    return NextResponse.json({ status: row.status, roomUrl: null });
  }

  const submissionsResult = await listSubmissions(row.terac_opportunity_id, 'awaiting_review');
  if (!submissionsResult.ok) {
    return NextResponse.json({ status: row.status, roomUrl: null });
  }

  const match = submissionsResult.data.data[0];
  if (!match) {
    // Only time out once we've confirmed no one has claimed it yet — a
    // match that arrives right at the timeout boundary should still win.
    if (row.claim_timeout_at && new Date(row.claim_timeout_at) < new Date()) {
      await supabase.from('expert_call_requests').update({ status: 'timed_out' }).eq('id', row.id);
      return NextResponse.json({ status: 'timed_out', roomUrl: null });
    }
    return NextResponse.json({ status: row.status, roomUrl: null });
  }

  const approveResult = await approveSubmission(match.id);
  if (!approveResult.ok) {
    return NextResponse.json({ status: row.status, roomUrl: null });
  }

  await supabase
    .from('expert_call_requests')
    .update({ status: 'scheduled', terac_submission_id: match.id })
    .eq('id', row.id);

  return NextResponse.json({
    status: 'scheduled',
    roomUrl: row.room_url,
  });
}
