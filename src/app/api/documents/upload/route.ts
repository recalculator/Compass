import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/requireUser';
import { getCurrentChild } from '@/lib/child/getCurrentChild';
import { extractDocumentData } from '@/lib/claude/extract';

const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 20 * 1024 * 1024;

const uploadSchema = z.object({
  file: z
    .instanceof(File, { message: 'No file provided' })
    .refine((f) => ALLOWED_TYPES.has(f.type), {
      message: 'Unsupported file type. Upload a PDF, JPG, PNG, or WEBP.',
    })
    .refine((f) => f.size <= MAX_BYTES, { message: 'File is too large (max 20MB).' }),
  document_type: z.enum(['iep', 'evaluation', 'therapy_note', 'other']).default('other'),
});

function dedupeMerge(existing: string[] | null, incoming: string[]) {
  const set = new Set([...(existing ?? []), ...incoming]);
  return Array.from(set);
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { user, supabase } = auth;

  const formData = await request.formData();
  const parsed = uploadSchema.safeParse({
    file: formData.get('file'),
    document_type: formData.get('document_type') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid request' },
      { status: 400 }
    );
  }

  const { file, document_type: documentType } = parsed.data;

  const profile = await getCurrentChild(supabase, user.id);

  if (!profile) {
    return NextResponse.json({ error: 'No child profile found. Finish onboarding first.' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('documents')
    .select('id')
    .eq('child_id', profile.id)
    .eq('file_name', file.name)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: `"${file.name}" has already been uploaded. Remove it first if you want to replace it.` },
      { status: 409 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');

  const storagePath = `${user.id}/${Date.now()}-${file.name}`;
  const { error: storageError } = await supabase.storage
    .from('documents')
    .upload(storagePath, buffer, { contentType: file.type });

  if (storageError) {
    return NextResponse.json({ error: `Upload failed: ${storageError.message}` }, { status: 500 });
  }

  const { data: doc, error: docInsertError } = await supabase
    .from('documents')
    .insert({
      child_id: profile.id,
      uploaded_by: user.id,
      file_name: file.name,
      file_path: storagePath,
      document_type: documentType,
      status: 'processing',
    })
    .select()
    .single();

  if (docInsertError || !doc) {
    return NextResponse.json({ error: 'Could not save document record.' }, { status: 500 });
  }

  try {
    const extracted = await extractDocumentData({ base64, mediaType: file.type, documentType });

    await supabase
      .from('documents')
      .update({ extracted_data: extracted, status: 'complete' })
      .eq('id', doc.id);

    const roadmapRows = [
      ...extracted.diagnoses.map((d) => ({
        child_id: profile.id,
        document_id: doc.id,
        type: 'diagnosis' as const,
        title: d,
        description: null,
        item_date: null,
      })),
      ...extracted.current_services.map((s) => ({
        child_id: profile.id,
        document_id: doc.id,
        type: 'service_start' as const,
        title: s.name,
        description: [s.provider, s.frequency].filter(Boolean).join(' · ') || null,
        item_date: null,
      })),
      ...extracted.goals.map((g) => ({
        child_id: profile.id,
        document_id: doc.id,
        type: 'goal' as const,
        title: `${g.area}: goal`,
        description: g.goal,
        item_date: null,
      })),
      ...extracted.recommendations.map((r) => ({
        child_id: profile.id,
        document_id: doc.id,
        type: 'recommendation' as const,
        title: r,
        description: null,
        item_date: null,
      })),
      ...extracted.important_dates.map((d) => ({
        child_id: profile.id,
        document_id: doc.id,
        type: 'milestone' as const,
        title: d.label,
        description: null,
        item_date: d.date,
      })),
    ];

    if (roadmapRows.length > 0) {
      await supabase.from('roadmap_items').insert(roadmapRows);
    }

    if (extracted.diagnoses.length > 0 || extracted.current_services.length > 0) {
      await supabase
        .from('child_profiles')
        .update({
          diagnosis: dedupeMerge(profile.diagnosis, extracted.diagnoses),
          current_services: dedupeMerge(
            profile.current_services,
            extracted.current_services.map((s) => s.name)
          ),
        })
        .eq('id', profile.id);
    }

    const locationPatch: Record<string, string> = {};
    if (extracted.location?.zip && !profile.location_zip) locationPatch.location_zip = extracted.location.zip;
    if (extracted.location?.city && !profile.location_city) locationPatch.location_city = extracted.location.city;
    if (extracted.location?.state && !profile.location_state) locationPatch.location_state = extracted.location.state;
    if (Object.keys(locationPatch).length > 0) {
      await supabase.from('child_profiles').update(locationPatch).eq('id', profile.id);
    }

    return NextResponse.json({ document: { ...doc, extracted_data: extracted, status: 'complete' } });
  } catch (err) {
    await supabase.from('documents').update({ status: 'failed' }).eq('id', doc.id);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Could not analyze document: ${message}` }, { status: 500 });
  }
}
