'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function PhoneSettings({
  userId,
  initialParentPhone,
}: {
  userId: string;
  initialParentPhone: string | null;
}) {
  const supabase = createClient();
  const [parentPhone, setParentPhone] = useState(initialParentPhone ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);

    const { error: userError } = await supabase
      .from('users')
      .update({ phone_number: parentPhone || null })
      .eq('id', userId);

    if (userError) {
      setError(userError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="card">
      <h3 className="text-base font-semibold text-sage-900">Phone number</h3>
      <p className="mt-1 text-sm text-sage-600">
        Used to connect your Compass data when texting our Poke assistant.
      </p>

      <div className="mt-4">
        <label className="block text-sm font-medium text-sage-800">Your phone number</label>
        <input
          type="tel"
          value={parentPhone}
          onChange={(e) => setParentPhone(e.target.value)}
          placeholder="+1 (555) 000-0000"
          className="mt-1 w-full rounded-xl border border-sage-200 bg-white px-3 py-2 text-sm text-sage-900 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-400"
        />
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-clay-50 px-3 py-2 text-sm text-clay-500">{error}</p>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="mt-4 rounded-xl bg-sage-600 px-4 py-2 text-sm font-medium text-white hover:bg-sage-700 disabled:opacity-50"
      >
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
      </button>

      <div className="mt-6 border-t border-sage-100 pt-5">
        <p className="text-sm font-medium text-sage-800">Text assistant</p>
        <p className="mt-1 text-sm text-sage-600">
          Once your phone number is saved above, you can text our Compass assistant anytime to find specialists or benefits.
        </p>
        <a
          href="https://poke.com/r/sI8cg_Y95AO"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block rounded-xl bg-sage-600 px-4 py-2 text-sm font-medium text-white hover:bg-sage-700"
        >
          Set up text alerts
        </a>
      </div>
    </div>
  );
}
