import { createServiceRoleClient } from '@/lib/supabase/server';
import { AnnotationForm } from '@/components/annotate/AnnotationForm';

export default async function AnnotatePage({ params }: { params: { requestId: string } }) {
  const supabase = createServiceRoleClient();

  const { data: request } = await supabase
    .from('expert_call_requests')
    .select('id')
    .eq('id', params.requestId)
    .maybeSingle();

  if (!request) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-xl font-semibold text-sage-900">Task not found</h1>
        <p className="mt-2 text-sm text-sage-600">
          This task link doesn&apos;t match anything we have on file.
        </p>
      </div>
    );
  }

  const { data: callNotes } = await supabase
    .from('call_notes')
    .select('id, ai_generated_summary')
    .eq('expert_call_request_id', params.requestId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold text-sage-900">Review an intake summary</h1>
      <p className="mt-2 text-sm text-sage-600">
        Compass connects parents of children with disabilities to support. An AI assistant just
        had a short voice conversation with a parent to understand what they need. Below is the
        AI&apos;s summary of that conversation — your job is to read it and tell us how clear and
        accurate it is, and improve it if you can. No medical or specialist knowledge is needed.
      </p>

      {!callNotes ? (
        <div className="card mt-6">
          <p className="text-sm text-sage-600">
            The conversation summary isn&apos;t ready yet. This usually takes under a minute after
            the parent finishes talking — refresh this page in a moment.
          </p>
        </div>
      ) : (
        <div className="card mt-6">
          <AnnotationForm callNotesId={callNotes.id} summary={callNotes.ai_generated_summary} />
        </div>
      )}
    </div>
  );
}
