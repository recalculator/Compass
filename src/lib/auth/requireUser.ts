import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/**
 * Shared "is there a logged-in user" check for API routes. Every route that
 * isn't public still has to create a Supabase client and look at the result —
 * this just centralizes that and the 401 response shape.
 */
export async function requireUser(): Promise<
  { user: User; supabase: SupabaseClient } | { error: NextResponse }
> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  }

  return { user, supabase };
}
