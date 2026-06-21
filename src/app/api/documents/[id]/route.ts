import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { user } = auth;

  const db = createServiceRoleClient();

  // Verify ownership via child_profiles
  const { data: doc } = await db
    .from('documents')
    .select('id, file_path, child_id')
    .eq('id', params.id)
    .maybeSingle();

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: cp } = await db
    .from('child_profiles')
    .select('id')
    .eq('id', doc.child_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!cp) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Delete roadmap items tied to this document
  await db.from('roadmap_items').delete().eq('document_id', doc.id);

  // Delete from storage
  await db.storage.from('documents').remove([doc.file_path]);

  // Delete the document record (cascades handled above)
  await db.from('documents').delete().eq('id', doc.id);

  return NextResponse.json({ success: true });
}
