import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChildProfile } from '@/lib/types';

/**
 * Resolves "the" child profile for a user.
 *
 * This assumes single-child-per-user for now: it returns the first
 * `child_profiles` row created for this user, even though the schema allows
 * more than one. If/when multi-child support is added, this function should
 * accept an explicit `childId` parameter instead of inferring "first by
 * created_at".
 */
export async function getCurrentChild(
  supabase: SupabaseClient,
  userId: string
): Promise<ChildProfile | null> {
  const { data } = await supabase
    .from('child_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return (data as ChildProfile | null) ?? null;
}
