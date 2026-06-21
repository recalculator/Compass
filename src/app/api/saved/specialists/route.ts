import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/requireUser';

const SaveSchema = z.object({
  name: z.string().min(1),
  specialty: z.string().min(1),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  description: z.string().optional().default(''),
  profileUrl: z.string().optional().default(''),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { user, supabase } = auth;

  const body = await request.json().catch(() => ({}));
  const parsed = SaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { name, specialty, phone, address, description, profileUrl } = parsed.data;

  const { data, error } = await supabase
    .from('saved_specialists')
    .insert({
      user_id: user.id,
      name,
      specialty,
      phone: phone || null,
      address: address || null,
      description: description || null,
      profile_url: profileUrl || null,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

export async function DELETE(request: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;
  const { user, supabase } = auth;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await supabase
    .from('saved_specialists')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
