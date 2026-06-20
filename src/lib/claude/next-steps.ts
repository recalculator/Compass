import { anthropic, CLAUDE_MODEL } from './client';
import type { ChildProfile, RoadmapItem } from '@/lib/types';

export type NextStepSuggestion = {
  title: string;
  description: string;
  urgency: 'now' | 'soon' | 'upcoming';
};

function extractJsonArray<T>(text: string): T {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('Claude did not return a JSON array');
  return JSON.parse(text.slice(start, end + 1)) as T;
}

function ageFromBirthDate(birthDate: string | null): string {
  if (!birthDate) return 'unknown age';
  const dob = new Date(birthDate);
  const months =
    (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  const years = Math.floor(months / 12);
  const remMonths = Math.round(months % 12);
  return years < 1 ? `${Math.round(months)} months old` : `${years}y ${remMonths}m old`;
}

export async function generateNextSteps(params: {
  profile: ChildProfile;
  roadmapItems: RoadmapItem[];
}): Promise<NextStepSuggestion[]> {
  const { profile, roadmapItems } = params;

  const historyText = roadmapItems
    .map((item) => `- [${item.type}] ${item.title}${item.item_date ? ` (${item.item_date})` : ''}: ${item.description ?? ''}`)
    .join('\n');

  const prompt = `A parent is navigating services for their child. Here is what we know:

Child: ${profile.child_name}, ${ageFromBirthDate(profile.birth_date)}
Diagnosis: ${profile.diagnosis?.join(', ') || 'not yet specified'}
Current services: ${profile.current_services?.join(', ') || 'none recorded yet'}
Location: ${profile.location_city ?? ''} ${profile.location_state ?? ''} ${profile.location_zip ?? ''}

Journey so far (from uploaded documents and milestones):
${historyText || '(no documents uploaded yet)'}

Based on the child's age, diagnosis, and current services, generate a proactive "what comes next" list — concrete, specific next steps this parent should consider (e.g. evaluations to request, services to pursue, transitions to prepare for like aging out of early intervention at 3, transition to adult services around 14-16, school evaluations, etc). Ground suggestions in standard early-intervention/special-education timelines and typical care pathways for this diagnosis. Avoid generic advice like "talk to your doctor" unless paired with something specific.

Respond with ONLY a JSON array, no preamble, of 3-6 items in this shape:
[{ "title": "short action title", "description": "1-2 sentences of why and how", "urgency": "now" | "soon" | "upcoming" }]`;

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') throw new Error('No text response from Claude');

  return extractJsonArray<NextStepSuggestion[]>(textBlock.text);
}
