import { Compass as CompassIcon } from 'lucide-react';
import clsx from 'clsx';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-600 text-white">
        <CompassIcon className="h-5 w-5" strokeWidth={2.25} />
      </div>
      <span className="text-lg font-bold tracking-tight text-sage-900">Compass</span>
    </div>
  );
}
