import { Download } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { ChildProfile, RoadmapItem } from '@/lib/types';
import { UploadForm } from './UploadForm';
import { Timeline } from './Timeline';
import { NextSteps } from './NextSteps';

export default async function RoadmapPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('child_profiles')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: roadmapItems } = await supabase
    .from('roadmap_items')
    .select('*')
    .eq('child_id', profile!.id)
    .order('item_date', { ascending: true });

  const items = (roadmapItems ?? []) as RoadmapItem[];
  const nextSteps = items.filter((i) => i.type === 'next_step');

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sage-900">
            {(profile as ChildProfile)?.child_name}&apos;s Roadmap
          </h1>
          <p className="mt-1 text-sm text-sage-600">
            Everything Compass knows about the journey so far, and what to do next.
          </p>
        </div>
        <a
          href="/api/roadmap/summary-pdf"
          className="btn-secondary shrink-0 whitespace-nowrap text-sm"
        >
          <Download className="h-4 w-4" />
          One-page summary
        </a>
      </div>

      <div className="mt-8 space-y-6">
        <UploadForm />
        <NextSteps items={nextSteps} />
        <Timeline items={items} />
      </div>
    </div>
  );
}
