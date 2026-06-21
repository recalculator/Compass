const DAILY_BASE_URL = 'https://api.daily.co/v1';

type DailyResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function dailyRequest<T>(path: string, init?: RequestInit): Promise<DailyResult<T>> {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) return { ok: false, error: 'Daily is not configured (DAILY_API_KEY missing).' };

  const res = await fetch(`${DAILY_BASE_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return { ok: false, error: body?.error ?? body?.info ?? `Daily responded ${res.status}` };
  }
  return { ok: true, data: (await res.json()) as T };
}

type DailyRoom = { name: string; url: string };
type DailyMeetingToken = { token: string };

export async function createCallRoom(params: {
  expertCallRequestId: string;
  expiresInMinutes?: number;
}): Promise<{ ok: true; roomUrl: string; roomName: string } | { ok: false; error: string }> {
  const expiresInMinutes = params.expiresInMinutes ?? 120;
  const exp = Math.floor(Date.now() / 1000) + expiresInMinutes * 60;

  const roomResult = await dailyRequest<DailyRoom>('/rooms', {
    method: 'POST',
    body: JSON.stringify({
      name: `connect-${params.expertCallRequestId}`,
      privacy: 'private',
      properties: {
        enable_knocking: false,
        exp,
        max_participants: 2,
      },
    }),
  });
  if (!roomResult.ok) return roomResult;

  const tokenResult = await dailyRequest<DailyMeetingToken>('/meeting-tokens', {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        room_name: roomResult.data.name,
        exp,
        eject_at_token_exp: true,
      },
    }),
  });
  if (!tokenResult.ok) return tokenResult;

  return {
    ok: true,
    roomUrl: `${roomResult.data.url}?t=${tokenResult.data.token}`,
    roomName: roomResult.data.name,
  };
}
