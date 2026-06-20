'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function EmailPreferences({
  userId,
  initialEnabled,
}: {
  userId: string;
  initialEnabled: boolean;
}) {
  const supabase = createClient();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !enabled;
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('users')
      .update({ email_digest_enabled: next })
      .eq('id', userId);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setEnabled(next);
  }

  return (
    <div className="card">
      <h3 className="text-base font-semibold text-sage-900">Weekly digest email</h3>
      <p className="mt-1 text-sm text-sage-600">
        A warm weekly email with upcoming appointments, IEP deadlines, a focus tip, and
        what&apos;s trending in the Village.
      </p>

      <div className="mt-4 flex items-center justify-between rounded-xl2 bg-sage-50 px-4 py-3">
        <span className="text-sm font-medium text-sage-800">
          {enabled ? 'Digest emails are on' : 'Digest emails are off'}
        </span>
        <button
          onClick={toggle}
          disabled={saving}
          role="switch"
          aria-checked={enabled}
          className={
            enabled
              ? 'relative h-6 w-11 rounded-full bg-sage-600 transition disabled:opacity-50'
              : 'relative h-6 w-11 rounded-full bg-sage-200 transition disabled:opacity-50'
          }
        >
          <span
            className={
              enabled
                ? 'absolute left-0.5 top-0.5 h-5 w-5 translate-x-5 rounded-full bg-white transition-transform'
                : 'absolute left-0.5 top-0.5 h-5 w-5 translate-x-0 rounded-full bg-white transition-transform'
            }
          />
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-clay-50 px-3 py-2 text-sm text-clay-500">{error}</p>
      )}

      <a
        href="/api/digest/preview"
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block text-sm font-medium text-sky-600 hover:underline"
      >
        Preview this week&apos;s digest →
      </a>
    </div>
  );
}
