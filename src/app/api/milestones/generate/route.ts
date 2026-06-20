import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { getCurrentChild } from '@/lib/child/getCurrentChild';
import { generateMilestoneAlerts } from '@/lib/claude/milestones';
import type { ChildProfile, RoadmapItem } from '@/lib/types';

export async function POST() {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { user, supabase } = auth;

  const profile = await getCurrentChild(supabase, user.id);

  if (!profile) {
    return NextResponse.json({ error: 'No child profile found.' }, { status: 400 });
  }

  const { data: roadmapItems } = await supabase
    .from('roadmap_items')
    .select('*')
    .eq('child_id', profile.id)
    .order('item_date', { ascending: true });

  try {
    const suggestions = await generateMilestoneAlerts({
      profile: profile as ChildProfile,
      roadmapItems: (roadmapItems ?? []) as RoadmapItem[],
      today: new Date(),
    });

    await supabase
      .from('milestone_alerts')
      .delete()
      .eq('user_id', user.id)
      .eq('status', 'active');

    const rows = suggestions.map((s) => ({
      user_id: user.id,
      child_profile_id: profile.id,
      alert_text: s.alert_text,
      due_date: s.due_date,
      status: 'active' as const,
    }));

    const { data: inserted } = rows.length > 0
      ? await supabase.from('milestone_alerts').insert(rows).select()
      : { data: [] };

    return NextResponse.json({ alerts: inserted ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Could not generate milestone alerts: ${message}` }, { status: 500 });
  }
}
