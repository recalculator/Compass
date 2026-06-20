import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/nav/Sidebar';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('child_profiles')
    .select('child_name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!profile) {
    redirect('/onboarding');
  }

  return (
    <div className="flex min-h-screen bg-sage-50">
      <Sidebar childName={profile.child_name} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
