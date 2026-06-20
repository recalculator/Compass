import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateNextSteps } from '@/lib/claude/next-steps';
import type { ChildProfile, RoadmapItem } from '@/lib/types';

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('child_profiles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: 'No child profile found.' }, { status: 400 });
  }

  const { data: roadmapItems } = await supabase
    .from('roadmap_items')
    .select('*')
    .eq('child_id', profile.id)
    .order('item_date', { ascending: true });

  try {
    const suggestions = await generateNextSteps({
      profile: profile as ChildProfile,
      roadmapItems: (roadmapItems ?? []) as RoadmapItem[],
    });

    await supabase
      .from('roadmap_items')
      .delete()
      .eq('child_id', profile.id)
      .eq('type', 'next_step');

    const rows = suggestions.map((s) => ({
      child_id: profile.id,
      type: 'next_step' as const,
      title: s.title,
      description: `${s.description}`,
      is_next_step: true,
      status: 'pending' as const,
    }));

    const { data: inserted } = await supabase.from('roadmap_items').insert(rows).select();

    return NextResponse.json({ nextSteps: inserted ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Could not generate next steps: ${message}` }, { status: 500 });
  }
}
