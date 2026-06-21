'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Map, Search, Users, HandCoins, Phone, Settings, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { Logo } from '@/components/ui/Logo';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/roadmap', label: 'Roadmap', icon: Map },
  { href: '/specialists', label: 'Specialists', icon: Search },
  { href: '/benefits', label: 'Benefit Finder', icon: HandCoins },
  { href: '/village', label: 'Village', icon: Users },
  { href: '/connect', label: 'Connect', icon: Phone },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ childName }: { childName?: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-sage-100 bg-[#fdf8f4] px-4 py-6">
      <div className="px-2">
        <Logo />
      </div>

      {childName && (
        <div className="mt-6 rounded-xl2 bg-sage-50 px-3 py-2.5 text-sm">
          <span className="text-sage-500">Navigating for</span>
          <p className="font-semibold text-sage-800">{childName}</p>
        </div>
      )}

      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 rounded-xl2 px-3 py-2.5 text-sm font-medium transition',
                active
                  ? 'bg-sage-100 text-sage-800 font-semibold'
                  : 'text-sage-600 hover:bg-sage-50'
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

<form action="/api/auth/signout" method="post">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl2 px-3 py-2.5 text-sm font-medium text-sage-500 transition hover:bg-sage-50"
        >
          <LogOut className="h-4.5 w-4.5" />
          Log out
        </button>
      </form>
    </aside>
  );
}
