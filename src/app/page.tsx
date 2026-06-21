import Link from 'next/link';
import Image from 'next/image';
import { HandCoins, Mic } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

const FEATURES = [
  {
    image: '/assets/feature-roadmap.png',
    title: 'The Roadmap',
    description:
      'Upload IEPs, evaluations, and therapy notes. Compass reads them, builds a visual timeline of your child\'s journey, and tells you what comes next.',
  },
  {
    image: '/assets/feature-directory.png',
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
    image: '/assets/feature-village.png',
    title: 'The Village',
    description:
      'A community of parents who get it. Ask questions, share what worked, and never feel like you\'re doing this alone.',
  },
  {
    image: '/assets/feature-iep-coach.png',
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
    <div className="min-h-screen bg-[#fdf8f4]">
      {/* Hero */}
      <div className="relative min-h-[75vh] overflow-hidden">
        <Image
          src="/assets/hero-bg.png"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-[#fdf8f4]/60" />

        <div className="relative z-10">
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

          <section className="mx-auto max-w-4xl px-6 pt-20 pb-32 text-center">
            <h1 className="text-5xl font-bold italic tracking-tight text-sage-900 sm:text-6xl">
              Your child&apos;s journey,<br />navigated.
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
        </div>
      </div>

      <main>
        {/* Feature cards */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="mb-10 text-center text-2xl font-bold text-sage-900">
            Everything you need, in one place
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="card flex gap-5 transition-transform hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="shrink-0">
                  {feature.image ? (
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      width={80}
                      height={80}
                      className="rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                      {feature.icon && <feature.icon className="h-8 w-8" />}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-sage-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-sage-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quote */}
        <section className="mx-auto max-w-3xl px-6 pb-24">
          <blockquote className="rounded-xl2 border-l-4 border-[#e6b893] bg-sage-50 p-8 text-lg italic text-sage-700 shadow-soft">
            &ldquo;You don&apos;t have to figure this out alone. Compass is here to help you
            understand where your child has been — and where to go next.&rdquo;
          </blockquote>
        </section>
      </main>

      <footer className="border-t border-sage-100 bg-[#fdf8f4] px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Logo />
          <p className="text-sm text-sage-400">
            © {new Date().getFullYear()} Compass. Built for the parents doing the hardest job there is.
          </p>
        </div>
      </footer>
    </div>
  );
}
