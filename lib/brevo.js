// Transactional email via Brevo (https://developers.brevo.com/reference/sendtransacemail).
// Env: BREVO_API_KEY, BREVO_SENDER_EMAIL (a sender verified in Brevo),
// BREVO_SENDER_NAME. Without a key, sends are skipped, not failed.
const ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

export function isEmailConfigured() {
  return Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL);
}

export async function sendEmail({ to, subject, html, text, tags }) {
  if (!isEmailConfigured()) return { status: 'skipped' };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: process.env.BREVO_SENDER_NAME || undefined },
      to: [to],
      subject,
      htmlContent: html,
      textContent: text,
      tags,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`Brevo ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const { messageId } = await res.json();
  return { status: 'sent', messageId };
}
