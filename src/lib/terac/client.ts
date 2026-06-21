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

export function launchOpportunity(opportunityId: string) {
  return teracRequest<Opportunity>(`/opportunities/${opportunityId}/launch`, {
    method: 'POST',
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
  });
}
