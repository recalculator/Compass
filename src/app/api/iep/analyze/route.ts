import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/requireUser';
import { analyzeIep } from '@/lib/claude/iep-coach';

const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 20 * 1024 * 1024;

const analyzeSchema = z.object({
  file: z
    .instanceof(File, { message: 'No file provided' })
    .refine((f) => ALLOWED_TYPES.has(f.type), {
      message: 'Unsupported file type. Upload a PDF, JPG, PNG, or WEBP.',
    })
    .refine((f) => f.size <= MAX_BYTES, { message: 'File is too large (max 20MB).' }),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  const formData = await request.formData();
  const parsed = analyzeSchema.safeParse({ file: formData.get('file') });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 }
    );
  }

  const { file } = parsed.data;

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString('base64');

  try {
    const analysis = await analyzeIep({ base64, mediaType: file.type });
    return NextResponse.json({ analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Could not analyze this IEP: ${message}` }, { status: 500 });
  }
}
