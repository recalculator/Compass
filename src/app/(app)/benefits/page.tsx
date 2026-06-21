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

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-bold text-sage-900">Benefit Finder</h1>
      <p className="mt-1 text-sm text-sage-600">
        State programs, Medicaid waivers, SSI, and disability services for your child.
      </p>

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
              diagnoses={profile.diagnosis!}
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
