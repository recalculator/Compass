import type { OpportunityFilter, ScreeningQuestion } from './types';

// Screens the Terac participant (the expert), not the parent requesting the call.
export function buildScreeningQuestions(): ScreeningQuestion[] {
  return [
    {
      key: 'autism_experience',
      text: 'Do you have direct clinical or professional experience working with autistic children or children with other developmental disabilities?',
      pick: 'one',
      answers: [
        { text: 'Yes, regularly in my current role', qualify_logic: 'must' },
        { text: 'Yes, occasionally', qualify_logic: 'may' },
        { text: 'No', qualify_logic: 'reject' },
      ],
    },
    {
      key: 'experience_detail',
      text: 'Briefly describe your relevant experience (role, setting, certifications, years).',
      pick: 'text',
      allow_paste: true,
    },
  ];
}

export function buildHealthcareProviderFilters(): OpportunityFilter[] {
  return [
    { 'multi_select--industry': { $in: ['healthcare'] } },
    { 'multi_select--job_function': { $in: ['healthcare-provider'] } },
  ];
}
