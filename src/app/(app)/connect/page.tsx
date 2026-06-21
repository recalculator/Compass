import { LiveConnectForm } from '@/components/connect/LiveConnectForm';

export default function ConnectPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold text-sage-900">Talk to a verified expert now</h1>
      <p className="mt-1 text-sm text-sage-600">
        Tell us what you need help with and we&apos;ll connect you with a real healthcare
        provider experienced in autism and developmental disability care over a live video call.
      </p>

      <div className="card mt-6">
        <LiveConnectForm />
      </div>
    </div>
  );
}
