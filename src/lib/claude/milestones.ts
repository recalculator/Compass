import { anthropic, CLAUDE_MODEL } from './client';
import { extractJsonArray } from './parse';
import type { ChildProfile, RoadmapItem } from '@/lib/types';

export type MilestoneAlertSuggestion = {
  alert_text: string;
  due_date: string | null;
};

export async function generateMilestoneAlerts(params: {
  profile: ChildProfile;
  roadmapItems: RoadmapItem[];
  today: Date;
}): Promise<MilestoneAlertSuggestion[]> {
  const { profile, roadmapItems, today } = params;

  const historyText = roadmapItems
    .map((item) => `- [${item.type}] ${item.title}${item.item_date ? ` (date: ${item.item_date})` : ''} (logged: ${item.created_at.slice(0, 10)})`)
    .join('\n');

  const prompt = `Today's date is ${today.toISOString().slice(0, 10)}.

Child: ${profile.child_name}
Date of birth: ${profile.birth_date ?? 'unknown'}
Diagnosis: ${profile.diagnosis?.join(', ') || 'not yet specified'}
Current services: ${profile.current_services?.join(', ') || 'none recorded'}

Roadmap history (documents, dates, evaluations, IEP-related milestones, goals logged so far):
${historyText || '(no roadmap items yet)'}

You are a proactive case-management assistant for a parent. Look for time-sensitive things they should act on now, using the dates above and standard special-education / early-intervention timelines. Examples of the kind of alert to generate (only if actually supported by the data — don't invent dates that aren't implied):
- An IEP or evaluation date that is approaching a typical 1-year/3-year renewal or re-evaluation window
- A birthday coming up that triggers a known transition (e.g. turning 3 = aging out of early intervention, turning 14-16 = transition planning, turning 18/21 = adult services)
- It's been roughly 6+ months since a particular type of evaluation (speech, OT, etc.) was logged, suggesting it may be due for an update
- Any explicit "important date" milestone item whose date is within the next 60 days

For each alert, return a short, specific, parent-facing sentence (similar in tone to: "Your child's IEP is up for renewal in 45 days — here's what to prepare.") and a due_date if one is implied (ISO YYYY-MM-DD), or null if it's not date-specific.

Respond with ONLY a JSON array, no preamble, of up to 6 items in this shape:
[{ "alert_text": "string", "due_date": "YYYY-MM-DD" | null }]

If there isn't enough information to generate a meaningful, grounded alert, return an empty array rather than guessing.`;

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') throw new Error('No text response from Claude');

  return extractJsonArray<MilestoneAlertSuggestion>(textBlock.text);
}
