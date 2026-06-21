import { createClient } from '@/lib/supabase/server';
import { getCurrentChild } from '@/lib/child/getCurrentChild';
import type { SpecialtyType } from '@/lib/types';
import { DirectoryLiveSearch } from '@/components/directory/DirectoryLiveSearch';
import { DirectorySave, DirectoryRestore } from '@/components/directory/DirectoryPersistence';
import { SavedTab } from '@/components/directory/SavedTab';
import Link from 'next/link';

const ALL_SPECIALTY_OPTIONS: { value: SpecialtyType | ''; label: string }[] = [
  { value: 'aba', label: 'ABA Therapy' },
  { value: 'speech', label: 'Speech Therapy' },
  { value: 'ot', label: 'Occupational Therapy' },
  { value: 'feeding', label: 'Feeding Therapy' },
  { value: 'developmental_pediatrician', label: 'Developmental Pediatrician' },
  { value: 'pt', label: 'Physical Therapy' },
  { value: 'psychology', label: 'Psychology' },
  { value: 'neurology', label: 'Neurology' },
];

const DIAGNOSIS_SPECIALTY_MAP: Record<string, string[]> = {
  'Autism Spectrum Disorder':    ['aba', 'ot', 'speech', 'developmental_pediatrician'],
  'Speech/Language Delay':       ['speech', 'developmental_pediatrician'],
  'Developmental Delay':         ['ot', 'speech', 'pt'],
  'ADHD':                        ['psychology', 'ot'],
  'Sensory Processing Disorder': ['ot', 'aba'],
  'Down Syndrome':               ['speech', 'ot', 'pt'],
};

function specialtiesForDiagnoses(diagnoses: string[]): { value: string; label: string }[] {
  const seen = new Set<string>();
  const result: { value: string; label: string }[] = [];
  for (const dx of diagnoses) {
    for (const val of DIAGNOSIS_SPECIALTY_MAP[dx] ?? []) {
      if (!seen.has(val)) {
        seen.add(val);
        const opt = ALL_SPECIALTY_OPTIONS.find((o) => o.value === val);
        if (opt) result.push({ value: opt.value, label: opt.label });
      }
    }
  }
  return result;
}

export default async function SpecialistsPage({
  searchParams,
}: {
  searchParams: { zip?: string; type?: string; tab?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = await getCurrentChild(supabase, user!.id);
  const tab = searchParams.tab ?? 'find';

  const zip = searchParams.zip ?? profile?.location_zip ?? '';
  const type = searchParams.type ?? '';

  const { data: savedSpecialists } = await supabase
    .from('saved_specialists')
    .select('id, name, specialty, phone, address, description, profile_url, saved_at')
    .eq('user_id', user!.id)
    .order('saved_at', { ascending: false });

  // name → savedId map so live cards can show correct saved state
  const savedMap: Record<string, string> = {};
  for (const s of savedSpecialists ?? []) {
    savedMap[s.name] = s.id;
  }


  const childSpecialtyOptions = specialtiesForDiagnoses(profile?.diagnosis ?? []);
  const savedCount = savedSpecialists?.length ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {zip ? <DirectorySave zip={zip} type={type} /> : <DirectoryRestore />}

      <h1 className="text-2xl font-bold text-sage-900">Specialists</h1>
      <p className="mt-1 text-sm text-sage-600">
        Find ABA, speech, OT, feeding, developmental, and other specialists near you.
      </p>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-sage-100">
        <Link
          href="/specialists"
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'find'
              ? 'border-b-2 border-sage-600 text-sage-900'
              : 'text-sage-400 hover:text-sage-700'
          }`}
        >
          Find
        </Link>
        <Link
          href="/specialists?tab=saved"
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

      {tab === 'saved' && (
        <SavedTab
          specialists={(savedSpecialists ?? []) as Parameters<typeof SavedTab>[0]['specialists']}
          benefits={[]}
        />
      )}

      {tab === 'find' && (
        <>
          <h2 className="text-lg font-semibold text-sage-900">Search all specialists</h2>

          <form className="card mt-3 grid gap-4 sm:grid-cols-2" method="get">
            <div>
              <label className="label-text" htmlFor="zip">ZIP code</label>
              <input id="zip" name="zip" defaultValue={zip} className="input-field" placeholder="94110" />
            </div>
            <div>
              <label className="label-text" htmlFor="type">Specialty</label>
              <select id="type" name="type" defaultValue={type} className="input-field">
                <option value="">All specialties</option>
                {childSpecialtyOptions.length > 0 && (
                  <optgroup label={`Recommended for ${profile?.child_name ?? 'your child'}`}>
                    {childSpecialtyOptions.map((opt) => (
                      <option key={`child-${opt.value}`} value={opt.value}>{opt.label}</option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="All specialties">
                  {ALL_SPECIALTY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary w-full sm:w-auto">Search</button>
            </div>
          </form>

          {zip && (
            <DirectoryLiveSearch zip={zip} specialtyType={type} savedMap={savedMap} />
          )}
          {!zip && (
            <p className="mt-8 text-center text-sm text-sage-500">
              Enter a ZIP code to search for specialists near you.
            </p>
          )}
        </>
      )}
    </div>
  );
}
