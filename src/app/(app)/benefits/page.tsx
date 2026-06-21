import { createClient } from '@/lib/supabase/server';
import { getCurrentChild } from '@/lib/child/getCurrentChild';
import { BenefitsSearch } from '@/components/benefits/BenefitsSearch';
import { SavedTab } from '@/components/directory/SavedTab';
import Link from 'next/link';

export default async function BenefitsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = await getCurrentChild(supabase, user!.id);
  const tab = searchParams.tab ?? 'find';

  const { data: savedBenefits } = await supabase
    .from('saved_benefits')
    .select('id, program_name, state, details, saved_at')
    .eq('user_id', user!.id)
    .order('saved_at', { ascending: false });

  const hasProfile = profile && profile.diagnosis?.length && profile.location_state;
  const savedCount = savedBenefits?.length ?? 0;

  let childAge: number | undefined;
  if (profile?.birth_date) {
    const birth = new Date(profile.birth_date);
    const now = new Date();
    childAge = now.getFullYear() - birth.getFullYear();
    const beforeBirthday =
      now.getMonth() < birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
    if (beforeBirthday) childAge -= 1;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="overflow-hidden rounded-xl2 bg-gradient-to-br from-clay-400 via-clay-400 to-sage-600 px-8 py-8 text-white shadow-soft">
        <p className="text-sm font-medium text-clay-50">Benefit Finder</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Find programs you may qualify for</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-clay-50">
          State programs, Medicaid waivers, SSI, and disability services matched to your
          child&apos;s diagnosis and age.
        </p>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-sage-100">
        <Link
          href="/benefits"
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'find'
              ? 'border-b-2 border-sage-600 text-sage-900'
              : 'text-sage-400 hover:text-sage-700'
          }`}
        >
          Find
        </Link>
        <Link
          href="/benefits?tab=saved"
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'saved'
              ? 'border-b-2 border-sage-600 text-sage-900'
              : 'text-sage-400 hover:text-sage-700'
          }`}
        >
          Saved
          {savedCount > 0 && (
            <span className="ml-1.5 rounded-full bg-sage-100 px-1.5 py-0.5 text-xs text-sage-600">
              {savedCount}
            </span>
          )}
        </Link>
      </div>

      {/* Saved tab */}
      {tab === 'saved' && (
        <SavedTab
          specialists={[]}
          benefits={(savedBenefits ?? []) as Parameters<typeof SavedTab>[0]['benefits']}
        />
      )}

      {/* Find tab */}
      {tab === 'find' && (
        <>
          {hasProfile ? (
            <BenefitsSearch
              locationState={profile.location_state!}
              zipCode={profile.location_zip ?? undefined}
              diagnoses={profile.diagnosis!}
              childAge={childAge}
              currentServices={profile.current_services ?? undefined}
            />
          ) : (
            <div className="card mt-6 text-sm text-sage-500">
              Complete your child&apos;s profile (diagnosis + state) to find benefit programs.
            </div>
          )}
        </>
      )}
    </div>
  );
}
