import { anthropic } from './client';

export type ModerationResult = { allowed: boolean; reason?: string };

export async function moderateContent(text: string): Promise<ModerationResult> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      system:
        'You moderate a private support community for parents of children with disabilities. ' +
        'Return valid JSON only — no prose, no markdown fences.',
      messages: [
        {
          role: 'user',
          content:
            `Decide if this message is appropriate. ` +
            `BLOCK only: explicit sexual content, hate speech or slurs targeting any group, ` +
            `direct harassment of a named individual, or detailed self-harm/violence instructions. ` +
            `ALLOW: venting frustration, expressing exhaustion or grief, criticising schools/systems, ` +
            `sharing negative experiences, dark humour from parents. ` +
            `Message: """${text}"""\n\n` +
            `Return: {"allowed": true} or {"allowed": false, "reason": "one short sentence"}`,
        },
      ],
    });

    const raw = message.content.find((b) => b.type === 'text');
    if (!raw || raw.type !== 'text') return { allowed: true };
    const parsed = JSON.parse(raw.text.trim()) as ModerationResult;
    return parsed;
  } catch {
    // Fail open — don't block posts due to moderation errors
    return { allowed: true };
  }
}
