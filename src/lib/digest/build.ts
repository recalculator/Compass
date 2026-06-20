import type { SupabaseClient } from '@supabase/supabase-js';
import { generateDigestContent } from '@/lib/claude/digest';
import { buildDigestEmailHtml } from '@/lib/email/template';
import type { ChildProfile, RoadmapItem } from '@/lib/types';

const DAY_MS = 24 * 60 * 60 * 1000;

async function getTrendingPost(supabase: SupabaseClient) {
  const twoWeeksAgo = new Date(Date.now() - 14 * DAY_MS).toISOString();

  const { data: recentPosts } = await supabase
    .from('community_posts')
    .select('id, title, body, created_at, comments:community_comments(count)')
    .gte('created_at', twoWeeksAgo)
    .order('created_at', { ascending: false })
    .limit(25);

  type PostRow = { title: string; body: string; comments: { count: number }[] };
  const rows = (recentPosts ?? []) as unknown as PostRow[];

  if (rows.length === 0) {
    const { data: fallback } = await supabase
      .from('community_posts')
      .select('title, body')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return fallback ? { title: fallback.title, body: fallback.body } : null;
  }

  const top = rows.reduce((best, row) => {
    const count = row.comments?.[0]?.count ?? 0;
    const bestCount = best.comments?.[0]?.count ?? 0;
    return count > bestCount ? row : best;
  }, rows[0]);

  return { title: top.title, body: top.body };
}

export async function buildDigestForUser(
  supabase: SupabaseClient,
  user: { id: string; email: string; full_name: string | null }
): Promise<{ subject: string; html: string; to: string } | null> {
  const { data: profile } = await supabase
    .from('child_profiles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!profile) return null;

  const { data: roadmapItems } = await supabase
    .from('roadmap_items')
    .select('*')
    .eq('child_id', profile.id)
    .order('item_date', { ascending: true });

  const items = (roadmapItems ?? []) as RoadmapItem[];

  const today = new Date();
  const weekFromNow = new Date(today.getTime() + 7 * DAY_MS);
  const monthFromNow = new Date(today.getTime() + 30 * DAY_MS);

  const datedItems = items.filter((i) => i.item_date);
  const upcomingThisWeek = datedItems.filter((i) => {
    const d = new Date(i.item_date!);
    return d >= today && d <= weekFromNow;
  });
  const iepDeadlines = datedItems.filter((i) => {
    const d = new Date(i.item_date!);
    const isIepRelated = i.type === 'milestone' || /iep/i.test(i.title);
    return isIepRelated && d >= today && d <= monthFromNow;
  });
  const goals = items.filter((i) => i.type === 'goal').slice(0, 5);

  const trendingPost = await getTrendingPost(supabase);

  const content = await generateDigestContent({
    parentName: user.full_name ?? 'there',
    profile: profile as ChildProfile,
    upcomingThisWeek,
    iepDeadlines,
    goals,
    trendingPost,
    today,
  });

  const html = buildDigestEmailHtml(content, profile.child_name);
  const subject = `This week for ${profile.child_name} 🧭`;

  return { subject, html, to: user.email };
}
