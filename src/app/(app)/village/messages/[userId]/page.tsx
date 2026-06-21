import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireUser } from '@/lib/auth/requireUser';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { MessageThread } from '@/components/village/MessageThread';

export default async function DmPage({ params }: { params: { userId: string } }) {
  const auth = await requireUser();
  if ('error' in auth) redirect('/login');
  const { user } = auth;

  const db = createServiceRoleClient();

  // Fetch the other user's name
  const { data: recipient } = await db
    .from('users')
    .select('id, full_name')
    .eq('id', params.userId)
    .maybeSingle();

  if (!recipient) notFound();

  // Fetch message thread
  const { data: messages } = await db
    .from('direct_messages')
    .select('id, sender_id, body, created_at')
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${params.userId}),and(sender_id.eq.${params.userId},recipient_id.eq.${user.id})`,
    )
    .order('created_at', { ascending: true });

  // Mark incoming messages as read
  await db
    .from('direct_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', user.id)
    .eq('sender_id', params.userId)
    .is('read_at', null);

  return (
    <div className="mx-auto flex h-[calc(100vh-80px)] max-w-2xl flex-col px-4 py-6">
      <Link
        href="/village?tab=messages"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-sage-600 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Messages
      </Link>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-sage-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-200 text-xs font-bold text-sage-700">
          {recipient.full_name[0]?.toUpperCase() ?? 'P'}
        </div>
        <span className="font-semibold text-sage-900">{recipient.full_name}</span>
      </div>

      <div className="mt-4 flex-1 overflow-hidden rounded-xl border border-sage-100 bg-white shadow-sm">
        <MessageThread
          recipientId={recipient.id}
          recipientName={recipient.full_name}
          initialMessages={messages ?? []}
          myId={user.id}
        />
      </div>
    </div>
  );
}
