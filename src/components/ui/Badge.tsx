import clsx from 'clsx';

const VARIANTS = {
  sage: 'bg-sage-100 text-sage-700',
  sky: 'bg-sky-100 text-sky-700',
  clay: 'bg-clay-100 text-clay-500',
  gray: 'bg-gray-100 text-gray-600',
};

export function Badge({
  children,
  variant = 'sage',
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
