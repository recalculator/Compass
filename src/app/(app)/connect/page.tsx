import { MicConnect } from '@/components/connect/MicConnect';

export default function ConnectPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="overflow-hidden rounded-xl2 bg-gradient-to-br from-sage-600 via-sage-600 to-clay-400 px-8 py-8 text-white shadow-soft">
        <p className="text-sm font-medium text-sage-100">Connect</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Talk it through right now</h1>
        <p className="mt-2 text-sm leading-relaxed text-sage-100">
          Press the mic and tell our AI comfort companion what&apos;s going on. Afterward, a general
          population reviewer in our research pool will read through the conversation — they&apos;re
          not a verified clinician, but they&apos;ll help us understand what kind of support would
          actually be useful.
        </p>
      </div>

      <div className="card mt-6">
        <MicConnect />
      </div>
    </div>
  );
}
