import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { getCurrentChild } from '@/lib/child/getCurrentChild';

export async function DELETE() {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { user, supabase } = auth;

  const profile = await getCurrentChild(supabase, user.id);
  if (!profile) {
    return NextResponse.json({ error: 'No child profile found.' }, { status: 400 });
  }

  // Fetch all document storage paths before deleting records
  const { data: docs } = await supabase
    .from('documents')
    .select('file_path')
    .eq('child_id', profile.id);

  const paths = (docs ?? []).map((d) => d.file_path).filter(Boolean);
  if (paths.length > 0) {
    await supabase.storage.from('documents').remove(paths);
  }

  // Delete all roadmap items for this child
  await supabase.from('roadmap_items').delete().eq('child_id', profile.id);

  // Delete all document records for this child
  await supabase.from('documents').delete().eq('child_id', profile.id);

  return NextResponse.json({ ok: true });
}
