import { createClient } from '@/lib/supabase/server';
import { getCurrentChild } from '@/lib/child/getCurrentChild';
import type { Specialist, SpecialtyType } from '@/lib/types';
import { SpecialistCard } from '@/components/directory/SpecialistCard';

const SPECIALTY_OPTIONS: { value: SpecialtyType | ''; label: string }[] = [
  { value: '', label: 'All specialties' },
  { value: 'aba', label: 'ABA Therapy' },
  { value: 'speech', label: 'Speech Therapy' },
  { value: 'ot', label: 'Occupational Therapy' },
  { value: 'feeding', label: 'Feeding Therapy' },
  { value: 'developmental_pediatrician', label: 'Developmental Pediatrician' },
  { value: 'pt', label: 'Physical Therapy' },
  { value: 'psychology', label: 'Psychology' },
  { value: 'neurology', label: 'Neurology' },
];

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: { zip?: string; type?: string; telehealth?: string; insurance?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = await getCurrentChild(supabase, user!.id);

  const zip = searchParams.zip ?? profile?.location_zip ?? '';
  const type = searchParams.type ?? '';
  const telehealthOnly = searchParams.telehealth === 'true';
  const insurance = searchParams.insurance ?? '';

  let query = supabase.from('specialists').select('*');
  if (zip) query = query.eq('zip_code', zip);
  if (type) query = query.eq('specialty_type', type);
  if (telehealthOnly) query = query.eq('telehealth', true);
  if (insurance) query = query.contains('insurance_accepted', [insurance]);

  const { data: specialists } = await query.order('name', { ascending: true });

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-bold text-sage-900">Directory</h1>
      <p className="mt-1 text-sm text-sage-600">
        Find specialists near you — ABA, speech, OT, feeding, developmental pediatrics, and more.
      </p>

      <form className="card mt-6 grid gap-4 sm:grid-cols-2" method="get">
        <div>
          <label className="label-text" htmlFor="zip">ZIP code</label>
          <input id="zip" name="zip" defaultValue={zip} className="input-field" placeholder="94110" />
        </div>
        <div>
          <label className="label-text" htmlFor="type">Specialty</label>
          <select id="type" name="type" defaultValue={type} className="input-field">
            {SPECIALTY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-text" htmlFor="insurance">Insurance</label>
          <input id="insurance" name="insurance" defaultValue={insurance} className="input-field" placeholder="e.g. Aetna" />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-sage-700">
            <input
              type="checkbox"
              name="telehealth"
              value="true"
              defaultChecked={telehealthOnly}
              className="h-4 w-4 rounded border-sage-300 text-sage-600 focus:ring-sage-400"
            />
            Telehealth available only
          </label>
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary w-full sm:w-auto">Search</button>
        </div>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(specialists ?? []).map((specialist) => (
          <SpecialistCard key={specialist.id} specialist={specialist as Specialist} />
        ))}
      </div>

      {(specialists ?? []).length === 0 && (
        <p className="mt-8 text-center text-sm text-sage-500">
          No specialists found matching your filters. Try widening your search.
        </p>
      )}
    </div>
  );
}
