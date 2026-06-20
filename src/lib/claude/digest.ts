import { anthropic, CLAUDE_MODEL } from './client';
import { extractJson } from './parse';
import type { ChildProfile, RoadmapItem } from '@/lib/types';

export type DigestContent = {
  greeting: string;
  appointments: { title: string; date: string }[];
  iep_deadlines: { title: string; date: string; days_until: number }[];
  weekly_focus: string;
  trending_post: { title: string; excerpt: string } | null;
  closing_line: string;
};

export async function generateDigestContent(params: {
  parentName: string;
  profile: ChildProfile;
  upcomingThisWeek: RoadmapItem[];
  iepDeadlines: RoadmapItem[];
  goals: RoadmapItem[];
  trendingPost: { title: string; body: string } | null;
  today: Date;
}): Promise<DigestContent> {
  const { parentName, profile, upcomingThisWeek, iepDeadlines, goals, trendingPost, today } = params;

  const fmt = (items: RoadmapItem[]) =>
    items.map((i) => `- ${i.title}${i.item_date ? ` (${i.item_date})` : ''}${i.description ? `: ${i.description}` : ''}`).join('\n') || '(none)';

  const prompt = `Today's date is ${today.toISOString().slice(0, 10)}. Write the content for a warm weekly email digest for ${parentName}, parent of ${profile.child_name}.

This week's appointments / dated milestones:
${fmt(upcomingThisWeek)}

IEP-related deadlines within the next 30 days:
${fmt(iepDeadlines)}

Current goals on the roadmap:
${fmt(goals)}

A trending Village community post to highlight (or none):
${trendingPost ? `Title: ${trendingPost.title}\nBody: ${trendingPost.body.slice(0, 500)}` : '(no trending post this week)'}

Write:
1. A short warm greeting (one sentence, mention ${profile.child_name} by name).
2. The appointments list, reformatted as short title + date strings (use the data given, don't invent new ones — if there are none, return an empty array).
3. The IEP deadlines, same format, but also compute days_until as an integer from today's date.
4. A "this week's focus" tip: 1-2 sentences, concrete and specific, grounded in the goals listed above (or general encouragement if no goals exist).
5. If a trending post was given, a one-sentence excerpt/teaser inviting them to read it in the Village. If none was given, return null.
6. A warm, brief motivational closing line (one sentence, not generic platitude — specific to the work of parenting a child with these needs).

Respond with ONLY a JSON object, no preamble, in this shape:
{
  "greeting": "string",
  "appointments": [{ "title": "string", "date": "string" }],
  "iep_deadlines": [{ "title": "string", "date": "string", "days_until": number }],
  "weekly_focus": "string",
  "trending_post": { "title": "string", "excerpt": "string" } | null,
  "closing_line": "string"
}`;

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1536,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') throw new Error('No text response from Claude');

  return extractJson<DigestContent>(textBlock.text);
}
