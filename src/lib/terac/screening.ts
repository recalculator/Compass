import type { ScreeningQuestion } from './types';

// General-population annotators only — no profession-based filters or
// disqualifying questions. This task is reviewing/rating an AI-generated
// summary, not vetting a clinical expert.
export function buildScreeningQuestions(): ScreeningQuestion[] {
  return [
    {
      key: 'context_note',
      text: 'Anything you\'d like us to know before you start this task? (optional)',
      pick: 'text',
      allow_paste: true,
    },
  ];
}
