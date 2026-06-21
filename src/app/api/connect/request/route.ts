import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { getCurrentChild } from '@/lib/child/getCurrentChild';
import { createCallRoom } from '@/lib/daily/client';

const ROOM_EXPIRY_MINUTES = 120;

// Creates the request row and the Daily call room (used later for an
// optional human "join call" link) the moment the parent presses the mic
// button. The Terac opportunity itself isn't created here anymore — it
// can't be, since there's no topic yet. It's created once the intake
// conversation ends and Vapi's end-of-call webhook delivers a summary
// (see /api/vapi/webhook).
export async function POST() {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { user, supabase } = auth;

  const child = await getCurrentChild(supabase, user.id);

  const { data: row, error: insertError } = await supabase
    .from('expert_call_requests')
    .insert({ user_id: user.id, child_id: child?.id ?? null, status: 'pending' })
    .select('id')
    .single();

  if (insertError || !row) {
    return NextResponse.json({ error: insertError?.message ?? 'Could not create request.' }, { status: 500 });
  }

  const requestId = row.id as string;

  let roomResult: Awaited<ReturnType<typeof createCallRoom>>;
  try {
    roomResult = await createCallRoom({
      expertCallRequestId: requestId,
      expiresInMinutes: ROOM_EXPIRY_MINUTES,
    });
  } catch (err) {
    console.error('[connect/request] createCallRoom threw:', err);
    await supabase
      .from('expert_call_requests')
      .update({ status: 'failed', error_message: err instanceof Error ? err.message : String(err) })
      .eq('id', requestId);
    return NextResponse.json({ error: `Daily call failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }

  if (!roomResult.ok) {
    console.error('[connect/request] createCallRoom failed:', roomResult.error);
    await supabase
      .from('expert_call_requests')
      .update({ status: 'failed', error_message: roomResult.error })
      .eq('id', requestId);
    return NextResponse.json({ error: roomResult.error }, { status: 500 });
  }

  await supabase
    .from('expert_call_requests')
    .update({ room_url: roomResult.roomUrl, room_name: roomResult.roomName })
    .eq('id', requestId);

  return NextResponse.json({ requestId });
}
