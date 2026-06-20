'use client';

import { useRef, useState } from 'react';
import { UploadCloud, Loader2, AlertTriangle, HelpCircle, MessageCircleQuestion } from 'lucide-react';
import type { IepAnalysis } from '@/lib/claude/iep-coach';

export function IepCoachClient() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<IepAnalysis | null>(null);

  async function handleFile(file: File) {
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/iep/analyze', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not analyze this IEP');
      setAnalysis(json.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setAnalyzing(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-base font-semibold text-sage-900">Upload your child&apos;s IEP</h3>
        <p className="mt-1 text-sm text-sage-600">
          Compass will explain every section in plain English, flag anything to question,
          and give you a list of questions for your next meeting.
        </p>

        <label
          className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl2 border-2 border-dashed border-sage-200 bg-sage-50 px-6 py-10 text-center transition hover:border-sage-400"
          htmlFor="iep-upload"
        >
          {analyzing ? (
            <Loader2 className="h-6 w-6 animate-spin text-sage-600" />
          ) : (
            <UploadCloud className="h-6 w-6 text-sage-500" />
          )}
          <span className="text-sm font-medium text-sage-700">
            {analyzing ? 'Reading the IEP carefully…' : 'Click to upload, or drag a file here'}
          </span>
          <span className="text-xs text-sage-400">PDF, JPG, or PNG, up to 20MB</span>
          <input
            id="iep-upload"
            ref={fileInput}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={analyzing}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>

        {error && (
          <p className="mt-3 rounded-lg bg-clay-50 px-3 py-2 text-sm text-clay-500">{error}</p>
        )}
      </div>

      {analysis && (
        <>
          <div className="card">
            <h3 className="text-base font-semibold text-sage-900">Overview</h3>
            <p className="mt-2 text-sm text-sage-700">{analysis.overview}</p>
          </div>

          <div className="card">
            <h3 className="text-base font-semibold text-sage-900">Section by section</h3>
            <div className="mt-4 space-y-5">
              {analysis.sections.map((section, i) => (
                <div key={i} className="border-b border-sage-100 pb-4 last:border-0 last:pb-0">
                  <h4 className="font-semibold text-sage-800">{section.section_title}</h4>
                  <p className="mt-1 text-sm text-sage-600">{section.plain_english}</p>
                  {section.flag.level && (
                    <div className="mt-2 flex items-start gap-2 rounded-xl2 bg-clay-50 px-3 py-2 text-sm text-clay-500">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        <strong className="capitalize">{section.flag.level}:</strong> {section.flag.note}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="flex items-center gap-2 text-base font-semibold text-sage-900">
              <MessageCircleQuestion className="h-5 w-5 text-sky-600" />
              Questions to bring to your next meeting
            </h3>
            <ul className="mt-3 space-y-2">
              {analysis.questions_to_ask.map((q, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-sage-700">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                  {q}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
