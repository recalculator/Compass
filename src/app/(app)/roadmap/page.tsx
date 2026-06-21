import { Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentChild } from '@/lib/child/getCurrentChild';
import type { ChildProfile, RoadmapItem } from '@/lib/types';
import { UploadForm } from './UploadForm';
import { DocumentsList } from './DocumentsList';
import { SummaryReport } from './SummaryReport';
import { NextSteps } from './NextSteps';

export default async function RoadmapPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = await getCurrentChild(supabase, user!.id);

  const [{ data: roadmapItems }, { data: documents }] = await Promise.all([
    supabase
      .from('roadmap_items')
      .select('*')
      .eq('child_id', profile!.id)
      .order('item_date', { ascending: true }),
    supabase
      .from('documents')
      .select('id, file_name, document_type, created_at, status')
      .eq('child_id', profile!.id)
      .order('created_at', { ascending: false }),
  ]);

  const items = (roadmapItems ?? []) as RoadmapItem[];
  const nextSteps = items.filter((i) => i.type === 'next_step');

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sage-900">
            {(profile as ChildProfile)?.child_name}&apos;s Roadmap
          </h1>
          <p className="mt-1 text-sm text-sage-600">
            Everything Compass knows about the journey so far.
          </p>
        </div>
        <a
          href="/api/roadmap/summary-pdf"
          className="btn-secondary shrink-0 whitespace-nowrap text-sm"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </a>
      </div>

      <div className="mt-8 space-y-6">
        {/* Documents section */}
        <div className="card space-y-4">
          <div>
            <h3 className="text-base font-semibold text-sage-900">Documents</h3>
            <p className="mt-1 text-sm text-sage-500">
              Upload IEPs, evaluations, or therapy notes once — Compass reads them and builds your report automatically. Remove any you no longer want included.
            </p>
          </div>

          <DocumentsList documents={documents ?? []} />
          <UploadForm />
        </div>

        {/* What comes next */}
        <NextSteps items={nextSteps} />

        {/* Inline summary report */}
        <SummaryReport
          profile={profile as ChildProfile}
          items={items}
        />
      </div>
    </div>
  );
}
