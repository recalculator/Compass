import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CallRoom } from '@/components/connect/CallRoom';
import { ShareCallLink } from '@/components/connect/ShareCallLink';

export default async function ConnectCallPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: row } = await supabase
    .from('expert_call_requests')
    .select('room_url')
    .eq('id', params.id)
    .maybeSingle();

  if (!row || !row.room_url) {
    redirect('/connect');
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-bold text-sage-900">Your call</h1>
      <div className="mt-4">
        <ShareCallLink roomUrl={row.room_url} />
      </div>
      <div className="card mt-6">
        <CallRoom roomUrl={row.room_url} />
      </div>
    </div>
  );
}
