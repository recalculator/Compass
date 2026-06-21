import { createClient } from '@/lib/supabase/server';
import { EmailPreferences } from '@/components/settings/EmailPreferences';
import { PhoneSettings } from '@/components/settings/PhoneSettings';
import { ChildProfileSettings } from '@/components/settings/ChildProfileSettings';

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: userRow } = await supabase
    .from('users')
    .select('id, email, full_name, email_digest_enabled, phone_number')
    .eq('id', user!.id)
    .single();

  const { data: childRow } = await supabase
    .from('child_profiles')
    .select('id, child_name, birth_date, diagnosis, current_services, location_zip, location_city, location_state')
    .eq('user_id', user!.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold text-sage-900">Settings</h1>
      <p className="mt-1 text-sm text-sage-600">{userRow?.email}</p>

      <div className="mt-8 space-y-6">
        {childRow && (
          <ChildProfileSettings
            childId={childRow.id}
            initialName={childRow.child_name}
            initialBirthDate={childRow.birth_date}
            initialDiagnosis={childRow.diagnosis ?? []}
            initialServices={childRow.current_services ?? []}
            initialZip={childRow.location_zip}
            initialCity={childRow.location_city}
            initialState={childRow.location_state}
          />
        )}
        <EmailPreferences userId={userRow!.id} initialEnabled={userRow!.email_digest_enabled} />
        <PhoneSettings
          userId={userRow!.id}
          initialParentPhone={userRow?.phone_number ?? null}
        />
      </div>
    </div>
  );
}
