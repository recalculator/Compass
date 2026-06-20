import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeIep } from '@/lib/claude/iep-coach';

const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type. Upload a PDF, JPG, PNG, or WEBP.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File is too large (max 20MB).' }, { status: 400 });
  }

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
