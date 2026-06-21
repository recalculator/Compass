import { createServiceRoleClient } from '@/lib/supabase/server';
import { ComparisonForm } from '@/components/compare/ComparisonForm';

export default async function ComparePage({ params }: { params: { pairId: string } }) {
  const supabase = createServiceRoleClient();

  const { data: pair } = await supabase
    .from('comparison_pairs')
    .select('id, summary_a, summary_b')
    .eq('id', params.pairId)
    .maybeSingle();

  if (!pair) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-xl font-semibold text-sage-900">Task not found</h1>
        <p className="mt-2 text-sm text-sage-600">
          This task link doesn&apos;t match anything we have on file.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold text-sage-900">Which summary is clearer?</h1>
      <p className="mt-2 text-sm text-sage-600">
        Below are two AI-generated summaries of the same parent conversation, written two
        different ways. Read both and tell us which one is clearer and more useful — no medical
        or specialist knowledge is needed.
      </p>

      <div className="card mt-6">
        <ComparisonForm pairId={pair.id} summaryA={pair.summary_a} summaryB={pair.summary_b} />
      </div>
    </div>
  );
}
