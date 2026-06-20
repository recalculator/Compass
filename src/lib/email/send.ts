type SendEmailParams = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

type SendEmailResult = { ok: true } | { ok: false; error: string };

// Sends via Mailgun's HTTP API directly with fetch — no email SDK/library.
// https://documentation.mailgun.com/en/latest/api-sending.html#sending
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  if (!apiKey || !domain) {
    return { ok: false, error: 'Mailgun is not configured (MAILGUN_API_KEY / MAILGUN_DOMAIN missing).' };
  }

  const baseUrl = process.env.MAILGUN_API_BASE_URL || 'https://api.mailgun.net/v3';
  const body = new URLSearchParams();
  body.set('from', params.from);
  body.set('to', params.to);
  body.set('subject', params.subject);
  body.set('html', params.html);

  const res = await fetch(`${baseUrl}/${domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: `Mailgun responded ${res.status}: ${text}` };
  }

  return { ok: true };
}
