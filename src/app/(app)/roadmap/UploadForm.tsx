'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, Loader2 } from 'lucide-react';
import type { DocumentType } from '@/lib/types';

const TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'iep', label: 'IEP' },
  { value: 'evaluation', label: 'Evaluation' },
  { value: 'therapy_note', label: 'Therapy Note' },
  { value: 'other', label: 'Other' },
];

export function UploadForm() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('iep');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);

    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <div className="card">
      <h3 className="text-base font-semibold text-sage-900">Upload a document</h3>
      <p className="mt-1 text-sm text-sage-600">
        IEPs, evaluations, or therapy notes. Compass reads it and adds what it finds to
        your roadmap.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setDocumentType(opt.value)}
            className={
              documentType === opt.value
                ? 'rounded-full bg-sage-600 px-3.5 py-1.5 text-xs font-semibold text-white'
                : 'rounded-full border border-sage-200 px-3.5 py-1.5 text-xs font-medium text-sage-600 hover:bg-sage-50'
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      <label
        className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl2 border-2 border-dashed border-sage-200 bg-sage-50 px-6 py-10 text-center transition hover:border-sage-400"
        htmlFor="file-upload"
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-sage-600" />
        ) : (
          <UploadCloud className="h-6 w-6 text-sage-500" />
        )}
        <span className="text-sm font-medium text-sage-700">
          {uploading ? 'Reading your document…' : 'Click to upload, or drag a file here'}
        </span>
        <span className="text-xs text-sage-400">PDF, JPG, or PNG, up to 20MB</span>
        <input
          id="file-upload"
          ref={fileInput}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={uploading}
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
  );
}
