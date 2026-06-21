import Link from 'next/link';
import { Map, Search, Users, FileCheck, HandCoins, Mic, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentChild } from '@/lib/child/getCurrentChild';
import type { MilestoneAlert } from '@/lib/types';
import { ComingUp } from '@/components/dashboard/ComingUp';

const QUICK_LINKS = [
  {
    href: '/roadmap',
    label: 'Roadmap',
    description: 'Timeline & next steps',
    icon: Map,
    tint: 'bg-sage-100 text-sage-700',
  },
  {
    href: '/specialists',
    label: 'Specialists',
    description: 'Find providers near you',
    icon: Search,
    tint: 'bg-sky-100 text-sky-700',
  },
  {
    href: '/benefits',
    label: 'Benefit Finder',
    description: 'Programs you may qualify for',
    icon: HandCoins,
    tint: 'bg-clay-100 text-clay-500',
  },
  {
    href: '/village',
    label: 'Village',
    description: 'Talk with other parents',
    icon: Users,
    tint: 'bg-sky-100 text-sky-700',
  },
  {
    href: '/iep-coach',
    label: 'IEP Coach',
    description: 'Plain-English IEP help',
    icon: FileCheck,
    tint: 'bg-sage-100 text-sage-700',
  },
  {
    href: '/connect',
    label: 'Connect',
    description: 'Talk it out, anytime',
    icon: Mic,
    tint: 'bg-clay-100 text-clay-500',
  },
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
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="overflow-hidden rounded-xl2 bg-gradient-to-br from-sage-600 via-sage-600 to-sky-700 px-8 py-10 text-white shadow-soft">
        <p className="text-sm font-medium text-sage-100">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Welcome back{profile?.child_name ? `, navigating for ${profile.child_name}` : ''}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-sage-100">
          Here&apos;s what Compass is tracking for you this week — pick up where you left off.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="card group flex flex-col gap-3 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl2 ${link.tint}`}>
                <link.icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-sage-300 transition group-hover:translate-x-0.5 group-hover:text-sage-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-sage-900">{link.label}</p>
              <p className="mt-0.5 text-xs text-sage-500">{link.description}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <ComingUp alerts={(alerts ?? []) as MilestoneAlert[]} />
      </div>
    </div>
  );
}
