import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Stagehand } from '@browserbasehq/stagehand';
import { requireUser } from '@/lib/auth/requireUser';
import { getCurrentChild } from '@/lib/child/getCurrentChild';

export const maxDuration = 300;

const RequestSchema = z.object({
  specialistName: z.string().min(1),
  profileUrl: z.string().url(),
  parentPhone: z.string().min(7),
  notes: z.string().optional().default(''),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { user, supabase } = auth;

  const body = await request.json().catch(() => ({}));
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 });
  }

  const { specialistName, profileUrl, parentPhone, notes } = parsed.data;

  try {
    const profile = await getCurrentChild(supabase, user.id);
    const childName = profile?.child_name ?? 'my child';
    const diagnoses = profile?.diagnosis ?? [];
    const reason = notes ||
      `Initial consultation for ${childName}${diagnoses.length ? ` (${diagnoses.slice(0, 2).join(', ')})` : ''}`;

    const apiKey = process.env.BROWSERBASE_API_KEY!;
    const projectId = process.env.BROWSERBASE_PROJECT_ID!;

    const stagehand = new Stagehand({
      env: 'BROWSERBASE',
      apiKey,
      projectId,
      model: 'anthropic/claude-sonnet-4-6',
      verbose: 1,
    });

    try {
      await stagehand.init();

      const isSearchPage = profileUrl.includes('/therapists?query=');
      const agent = stagehand.agent();
      await agent.execute({
        instruction: isSearchPage
          ? `Go to ${profileUrl}. ` +
            `Find the listing for "${specialistName}" in the search results and click on their name to open their profile. ` +
            `On their profile, find the appointment request or contact form (look for "Email ${specialistName}", "Request Appointment", or "Contact" button). ` +
            `Fill in the form with: ` +
            `Name: ${user.email?.split('@')[0] ?? 'Parent'}, ` +
            `Email: ${user.email}, ` +
            `Phone: ${parentPhone}, ` +
            `Message: "${reason}". ` +
            `Submit the form. Stop if you encounter a CAPTCHA or login wall.`
          : `Go to ${profileUrl}. ` +
            `Find the appointment request or contact form (look for "Email ${specialistName}", "Request Appointment", or "Contact" button). ` +
            `Fill in the form with: ` +
            `Name: ${user.email?.split('@')[0] ?? 'Parent'}, ` +
            `Email: ${user.email}, ` +
            `Phone: ${parentPhone}, ` +
            `Message: "${reason}". ` +
            `Submit the form. Stop if you encounter a CAPTCHA or login wall.`,
        maxSteps: 12,
      });

      return NextResponse.json({ success: true, message: 'Appointment request submitted.' });
    } finally {
      await stagehand.close();
    }
  } catch (err) {
    console.error('[/api/search/book-appointment]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Booking failed: ${message}` }, { status: 500 });
  }
}
