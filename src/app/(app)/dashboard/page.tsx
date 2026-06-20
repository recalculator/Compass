import Link from 'next/link';
import { Map, Search, Users, FileCheck, HandCoins } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentChild } from '@/lib/child/getCurrentChild';
import type { MilestoneAlert } from '@/lib/types';
import { ComingUp } from '@/components/dashboard/ComingUp';

const QUICK_LINKS = [
  { href: '/roadmap', label: 'Roadmap', icon: Map },
  { href: '/directory', label: 'Directory', icon: Search },
  { href: '/village', label: 'Village', icon: Users },
  { href: '/iep-coach', label: 'IEP Coach', icon: FileCheck },
  { href: '/dashboard/benefits', label: 'Benefits Finder', icon: HandCoins },
];

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const profile = await getCurrentChild(supabase, user!.id);

  const nowIso = new Date().toISOString();

  const { data: alerts } = await supabase
    .from('milestone_alerts')
    .select('*')
    .eq('user_id', user!.id)
    .or(`status.eq.active,and(status.eq.snoozed,snoozed_until.lte.${nowIso})`)
    .order('due_date', { ascending: true });

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-sage-900">
        Welcome back{profile?.child_name ? `, navigating for ${profile.child_name}` : ''}
      </h1>
      <p className="mt-1 text-sm text-sage-600">
        Here&apos;s what Compass is tracking for you this week.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="card flex flex-col items-center gap-2 py-4 text-center transition hover:shadow-none"
          >
            <link.icon className="h-5 w-5 text-sage-600" />
            <span className="text-xs font-medium text-sage-700">{link.label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <ComingUp alerts={(alerts ?? []) as MilestoneAlert[]} />
      </div>
    </div>
  );
}
