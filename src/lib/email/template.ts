import type { DigestContent } from '@/lib/claude/digest';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function row(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:6px 0;font-size:14px;color:#2d3e2f;">
        <strong>${escapeHtml(label)}</strong> — ${escapeHtml(value)}
      </td>
    </tr>`;
}

export function buildDigestEmailHtml(content: DigestContent, childName: string): string {
  const appointmentsHtml = content.appointments.length
    ? content.appointments.map((a) => row(a.date, a.title)).join('')
    : `<tr><td style="padding:6px 0;font-size:14px;color:#8a978b;">Nothing dated on the calendar this week.</td></tr>`;

  const deadlinesHtml = content.iep_deadlines.length
    ? content.iep_deadlines
        .map((d) => row(`${d.date} (${d.days_until} days)`, d.title))
        .join('')
    : `<tr><td style="padding:6px 0;font-size:14px;color:#8a978b;">No IEP deadlines in the next 30 days.</td></tr>`;

  const trendingHtml = content.trending_post
    ? `
      <tr>
        <td style="padding:16px;background-color:#f3f8fb;border-radius:12px;">
          <p style="margin:0 0 4px;font-size:13px;color:#3a6e96;font-weight:700;">FROM THE VILLAGE</p>
          <p style="margin:0 0 4px;font-size:15px;color:#2d3e2f;font-weight:700;">${escapeHtml(content.trending_post.title)}</p>
          <p style="margin:0;font-size:14px;color:#3f5a42;">${escapeHtml(content.trending_post.excerpt)}</p>
        </td>
      </tr>`
    : '';

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>This week for ${escapeHtml(childName)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f7f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f4;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="background-color:#4d7050;padding:24px 28px;">
                <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;">🧭 Compass</p>
                <p style="margin:4px 0 0;font-size:13px;color:#e6ede6;">This week for ${escapeHtml(childName)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <p style="margin:0 0 20px;font-size:15px;color:#2d3e2f;">${escapeHtml(content.greeting)}</p>

                <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.04em;color:#638b66;text-transform:uppercase;">This week's appointments</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                  ${appointmentsHtml}
                </table>

                <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.04em;color:#638b66;text-transform:uppercase;">IEP deadlines ahead</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                  ${deadlinesHtml}
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                  <tr>
                    <td style="padding:16px;background-color:#fdf8f4;border-radius:12px;">
                      <p style="margin:0 0 4px;font-size:13px;color:#cb7c46;font-weight:700;">THIS WEEK'S FOCUS</p>
                      <p style="margin:0;font-size:14px;color:#3f5a42;">${escapeHtml(content.weekly_focus)}</p>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
                  ${trendingHtml}
                </table>

                <p style="margin:24px 0 0;font-size:14px;font-style:italic;color:#4d7050;">${escapeHtml(content.closing_line)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background-color:#f4f7f4;text-align:center;">
                <p style="margin:0;font-size:11px;color:#8a978b;">
                  You're getting this because weekly digests are turned on in your Compass settings.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
