import { IepCoachClient } from './IepCoachClient';

export default function IepCoachPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-sage-900">IEP Coach</h1>
      <p className="mt-1 text-sm text-sage-600">
        Upload an IEP and get a plain-English walkthrough, things to question, and
        questions for your next meeting.
      </p>

      <div className="mt-8">
        <IepCoachClient />
      </div>
    </div>
  );
}
