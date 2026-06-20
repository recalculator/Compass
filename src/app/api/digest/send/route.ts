import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { buildDigestForUser } from '@/lib/digest/build';
import { sendEmail } from '@/lib/email/send';

// Triggered by an external scheduler (cron) hitting this route with a shared secret —
// not meant to be called from the browser. Uses the service role client so it can read
// every user's data regardless of RLS.
export async function POST(request: Request) {
  const secret = request.headers.get('x-digest-secret');
  if (!process.env.DIGEST_CRON_SECRET || secret !== process.env.DIGEST_CRON_SECRET) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  const fromEmail = process.env.DIGEST_FROM_EMAIL;
  if (!fromEmail) {
    return NextResponse.json({ error: 'DIGEST_FROM_EMAIL is not configured' }, { status: 500 });
  }

  const supabase = createServiceRoleClient();

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name')
    .eq('email_digest_enabled', true);

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const user of users ?? []) {
    try {
      const digest = await buildDigestForUser(supabase, user);

      if (!digest) {
        skipped += 1;
        continue;
      }

      const result = await sendEmail({
        from: fromEmail,
        to: digest.to,
        subject: digest.subject,
        html: digest.html,
      });

      await supabase.from('digest_logs').insert({
        user_id: user.id,
        status: result.ok ? 'sent' : 'failed',
        error_message: result.ok ? null : result.error,
      });

      if (result.ok) sent += 1;
      else failed += 1;
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : 'Unknown error';
      await supabase.from('digest_logs').insert({
        user_id: user.id,
        status: 'failed',
        error_message: message,
      });
    }
  }

  return NextResponse.json({ sent, failed, skipped, total: (users ?? []).length });
}
