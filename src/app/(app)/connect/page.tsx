import { MicConnect } from '@/components/connect/MicConnect';

export default function ConnectPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold text-sage-900">Talk it through right now</h1>
      <p className="mt-1 text-sm text-sage-600">
        Press the mic and tell our AI comfort companion what&apos;s going on. Afterward, a general
        population reviewer in our research pool will read through the conversation — they&apos;re
        not a verified clinician, but they&apos;ll help us understand what kind of support would
        actually be useful.
      </p>

      <div className="card mt-6">
        <MicConnect />
      </div>
    </div>
  );
}
