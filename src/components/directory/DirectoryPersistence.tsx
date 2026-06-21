'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'compass:lastDirectory';

type SavedDirectory = { zip: string; type: string };

export function DirectorySave({ zip, type }: { zip: string; type: string }) {
  useEffect(() => {
    if (zip) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ zip, type }));
    }
  }, [zip, type]);

  return null;
}

export function DirectoryRestore() {
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const saved: SavedDirectory = JSON.parse(raw);
      if (saved.zip) {
        const params = new URLSearchParams({ zip: saved.zip });
        if (saved.type) params.set('type', saved.type);
        router.replace(`/specialists?${params.toString()}`);
      }
    } catch {
      // ignore malformed
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
