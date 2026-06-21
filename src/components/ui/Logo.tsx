import Image from 'next/image';
import clsx from 'clsx';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <Image
        src="/assets/logo.png"
        alt="Compass logo"
        width={36}
        height={36}
        className="rounded-full"
      />
      <span className="text-lg font-bold tracking-tight text-sage-900">Compass</span>
    </div>
  );
}
