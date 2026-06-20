import { BenefitsClient } from './BenefitsClient';

export default function BenefitsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-bold text-sage-900">Benefits Finder</h1>
      <p className="mt-1 text-sm text-sage-600">
        Select your state and Compass will pull together Medicaid waivers, Regional
        Center services, SSI, ABLE accounts, grants, tax credits, and respite funding
        that may apply to your family.
      </p>

      <div className="mt-8">
        <BenefitsClient />
      </div>
    </div>
  );
}
