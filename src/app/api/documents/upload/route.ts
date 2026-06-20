import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractDocumentData } from '@/lib/claude/extract';
import type { DocumentType } from '@/lib/types';

const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 20 * 1024 * 1024;

function dedupeMerge(existing: string[] | null, incoming: string[]) {
  const set = new Set([...(existing ?? []), ...incoming]);
  return Array.from(set);
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const documentType = (formData.get('document_type') as DocumentType) || 'other';

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type. Upload a PDF, JPG, PNG, or WEBP.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File is too large (max 20MB).' }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('child_profiles')
    .select('id, diagnosis, current_services')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'No child profile found. Finish onboarding first.' }, { status: 400 });
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

    return NextResponse.json({ document: { ...doc, extracted_data: extracted, status: 'complete' } });
  } catch (err) {
    await supabase.from('documents').update({ status: 'failed' }).eq('id', doc.id);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Could not analyze document: ${message}` }, { status: 500 });
  }
}
