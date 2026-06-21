'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, Loader2, FileText, X } from 'lucide-react';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function clearFile() {
    setSelectedFile(null);
    setError(null);
    if (fileInput.current) fileInput.current.value = '';
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('document_type', documentType);
    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed');
      clearFile();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setUploading(false);
    }
  }

  if (selectedFile) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl border border-sage-200 bg-sage-50 px-4 py-3">
          <FileText className="h-4 w-4 shrink-0 text-sage-500" />
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-sage-900">{selectedFile.name}</p>
          {!uploading && (
            <button type="button" onClick={clearFile} className="shrink-0 rounded-full p-1 text-sage-400 hover:bg-sage-200">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDocumentType(opt.value)}
              className={
                documentType === opt.value
                  ? 'rounded-full bg-sage-600 px-3 py-1 text-xs font-semibold text-white'
                  : 'rounded-full border border-sage-200 px-3 py-1 text-xs font-medium text-sage-600 hover:bg-sage-50'
              }
            >
              {opt.label}
            </button>
          ))}
        </div>

        {error && <p className="rounded-lg bg-clay-50 px-3 py-2 text-sm text-clay-500">{error}</p>}

        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="btn-primary flex w-full items-center justify-center gap-2"
        >
          {uploading ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Reading your document…</>
          ) : (
            'Upload & analyze'
          )}
        </button>
      </div>
    );
  }

  return (
    <label
      className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-sage-200 bg-sage-50 px-6 py-8 text-center transition hover:border-sage-400"
      htmlFor="file-upload"
    >
      <UploadCloud className="h-5 w-5 text-sage-400" />
      <span className="text-sm font-medium text-sage-700">Add a document</span>
      <span className="text-xs text-sage-400">PDF, JPG, or PNG · up to 20MB</span>
      <input
        id="file-upload"
        ref={fileInput}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) { setSelectedFile(file); setError(null); }
        }}
      />
    </label>
  );
}
