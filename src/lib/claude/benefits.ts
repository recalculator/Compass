import { anthropic, CLAUDE_MODEL } from './client';
import type { BenefitProgram } from '@/lib/types';

function extractJsonArray<T>(text: string): T {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('Claude did not return a JSON array');
  return JSON.parse(text.slice(start, end + 1)) as T;
}

const SYSTEM_PROMPT = `You are a benefits navigator for parents of autistic and special needs children in the United States. You know state Medicaid HCBS waiver programs, Regional Center / DD agency systems, SSI, ABLE accounts, state grant programs, tax credits, and respite care funding. Be specific to the requested state where you can, and clearly generic/federal where state-specific detail isn't reliably knowable. Never invent a program name that you are not reasonably confident exists — if uncertain, describe the general federal program (e.g. SSI, ABLE) rather than fabricating a state-specific one.

Respond with ONLY a JSON array, no preamble. Each item must match this shape:
{
  "category": "medicaid_waiver" | "regional_center" | "ssi" | "able_account" | "state_grant" | "tax_credit" | "respite_care",
  "program_name": "string",
  "covers": "string — what the program actually pays for or provides",
  "qualifies": "string — who is eligible (age, diagnosis, income, residency)",
  "how_to_apply": "string — concrete first step to apply",
  "wait_time": "string or null — typical wait time if relevant (e.g. waiver waitlists)",
  "link": "string URL or null — an official .gov or state agency site if you're confident one exists, otherwise null"
}

Cover all of these categories with at least one entry each where applicable to the state:
- Medicaid waiver programs (e.g. HCBS / Katie Beckett-style waivers)
- Regional Center or state DD-agency case management services (note if the state doesn't use a Regional Center model)
- SSI eligibility basics for a minor child with a disability
- ABLE accounts (federal program, mention the specific state's ABLE plan name if it has one)
- State-specific grants for therapy or adaptive equipment
- Tax credits and deductions relevant to disability-related expenses
- Respite care funding/programs

Aim for 8-14 total entries.`;

export async function generateBenefits(params: { state: string }): Promise<BenefitProgram[]> {
  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Generate the benefits and funding list for a family of an autistic/special needs child living in ${params.state}.`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') throw new Error('No text response from Claude');

  return extractJsonArray<BenefitProgram[]>(textBlock.text);
}
