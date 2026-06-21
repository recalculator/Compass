import Link from 'next/link';
import { Map, Search, Users, FileCheck, HandCoins, Mic } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

const FEATURES = [
  {
    icon: Map,
    title: 'The Roadmap',
    description:
      'Upload IEPs, evaluations, and therapy notes. Compass reads them, builds a visual timeline of your child\'s journey, and tells you what comes next.',
  },
  {
    icon: Search,
    title: 'The Directory',
    description:
      'Find ABA, speech, OT, feeding, and developmental pediatric specialists near you, pulled live from real provider listings.',
  },
  {
    icon: HandCoins,
    title: 'Benefit Finder',
    description:
      'Discover Medicaid waivers, SSI, and state assistance programs matched to your child\'s diagnosis and age — not generic disability lists.',
  },
  {
    icon: Users,
    title: 'The Village',
    description:
      'A community of parents who get it. Ask questions, share what worked, and never feel like you\'re doing this alone.',
  },
  {
    icon: FileCheck,
    title: 'IEP Coach',
    description:
      'Upload your child\'s IEP and get a plain-English walkthrough, flags on anything to question, and questions to bring to your next meeting.',
  },
  {
    icon: Mic,
    title: 'Connect',
    description:
      'Press one button to talk it out with an AI companion any time you need to — no forms, no waiting room.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sage-50 via-sage-50 to-sky-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary">
            Get started
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-4xl px-6 pt-16 pb-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-sage-900 sm:text-5xl">
            Your child&apos;s journey, navigated.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-sage-700">
            Compass is a personal navigator for parents of autistic and special needs
            children. It knows your child, knows your journey, and tells you what to do
            next — so you can spend less time figuring out the system and more time with
            your kid.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/signup" className="btn-primary px-8 py-3 text-base">
              Start your roadmap
            </Link>
            <Link href="/login" className="btn-secondary px-8 py-3 text-base">
              I already have an account
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <h2 className="text-center text-2xl font-bold text-sage-900 sm:text-3xl">
            Everything you need, in one place
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="card transition-transform hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl2 bg-sky-100 text-sky-700">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-sage-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-sage-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-24 text-center">
          <p className="rounded-xl2 bg-white p-8 text-lg italic text-sage-700 shadow-soft">
            &ldquo;You don&apos;t have to figure this out alone. Compass is here to help you
            understand where your child has been — and where to go next.&rdquo;
          </p>
        </section>
      </main>

      <footer className="border-t border-sage-100 py-8 text-center text-sm text-sage-500">
        © {new Date().getFullYear()} Compass. Built for the parents doing the hardest job
        there is.
      </footer>
    </div>
  );
}
