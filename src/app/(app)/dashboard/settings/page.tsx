import { createClient } from '@/lib/supabase/server';
import { EmailPreferences } from '@/components/settings/EmailPreferences';

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: userRow } = await supabase
    .from('users')
    .select('id, email, full_name, email_digest_enabled')
    .eq('id', user!.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold text-sage-900">Settings</h1>
      <p className="mt-1 text-sm text-sage-600">{userRow?.email}</p>

      <div className="mt-8">
        <EmailPreferences userId={userRow!.id} initialEnabled={userRow!.email_digest_enabled} />
      </div>
    </div>
  );
}
