import type {
  CreateOpportunityParams,
  ListSubmissionsResponse,
  Opportunity,
  SubmissionDetail,
  SubmissionStatus,
} from './types';

const TERAC_BASE_URL = 'https://terac.com/api/external/v2';

type TeracResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function teracRequest<T>(path: string, init?: RequestInit): Promise<TeracResult<T>> {
  const apiKey = process.env.TERAC_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'Terac is not configured (TERAC_API_KEY missing).' };
  }

  const res = await fetch(`${TERAC_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return { ok: false, error: body?.message ?? `Terac responded ${res.status}` };
  }

  return { ok: true, data: (await res.json()) as T };
}

export function createOpportunity(params: CreateOpportunityParams) {
  return teracRequest<Opportunity>('/opportunities', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// Hard cost cap — launchOpportunity refuses to call Terac's launch endpoint
// (which spends real money) above this total. Confirmed real floor price is
// ~$16.50 for num_participants: 1 with no filters; $20 leaves headroom for
// that floor while still blocking anything abnormally expensive (e.g. the
// $162 specialist-filtered opportunity from earlier testing).
const MAX_LAUNCH_COST_CENTS = 2000;

export function launchOpportunity(opportunity: Pick<Opportunity, 'id' | 'pricing'>): Promise<TeracResult<Opportunity>> {
  const totalCostCents = opportunity.pricing?.total_cost_cents;

  if (typeof totalCostCents !== 'number') {
    const error = `Refusing to launch opportunity ${opportunity.id}: no pricing data on the opportunity, cannot verify cost.`;
    console.error('[terac/client] launch blocked:', error);
    return Promise.resolve({ ok: false, error });
  }

  if (totalCostCents > MAX_LAUNCH_COST_CENTS) {
    const error = `Refusing to launch opportunity ${opportunity.id}: total cost $${(totalCostCents / 100).toFixed(2)} exceeds the $${(MAX_LAUNCH_COST_CENTS / 100).toFixed(2)} cap.`;
    console.error('[terac/client] launch blocked:', error);
    return Promise.resolve({ ok: false, error });
  }

  return teracRequest<Opportunity>(`/opportunities/${opportunity.id}/launch`, {
    method: 'POST',
    body: '{}',
  });
}

export function listSubmissions(opportunityId: string, status?: SubmissionStatus) {
  const query = status ? `?status=${status}` : '';
  return teracRequest<ListSubmissionsResponse>(`/opportunities/${opportunityId}/submissions${query}`);
}

export function getSubmission(submissionId: string) {
  return teracRequest<SubmissionDetail>(`/submissions/${submissionId}`);
}

export function approveSubmission(submissionId: string) {
  return teracRequest<{ id: string; status: string }>(`/submissions/${submissionId}/approve`, {
    method: 'POST',
    body: '{}',
  });
}
