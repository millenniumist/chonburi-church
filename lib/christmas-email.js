// Confirmation email sent after a Christmas registration. Table layout +
// inline styles so it renders in Gmail/Outlook; dark navy + gold like the page.
const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function firstEmailAnswer(fields, answers) {
  const field = fields.find((f) => f.type === 'email' && answers?.[f.name]);
  return field ? String(answers[field.name]) : null;
}

export function renderChristmasEmail({ event, registration, ticketUrl }) {
  const name = registration.displayName || 'ท่านผู้มีเกียรติ';
  const details = [
    ['วันที่', event.dateLabel],
    ['เวลา', event.timeLabel],
    ['สถานที่', event.venue],
  ].filter(([, v]) => v);
  const ticket = registration.tId.toUpperCase();
  const subject = `${event.emailSubject} · ${ticket}`;

  const text = [
    `เรียน ${name}`,
    '',
    event.emailIntro,
    '',
    event.title,
    ...details.map(([k, v]) => `${k}: ${v}`),
    `หมายเลขบัตร: ${ticket}`,
    '',
    `ดูบัตรเชิญ: ${ticketUrl}`,
  ].join('\n');

  const html = `<!doctype html>
<html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#050b1a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050b1a;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0b1630;border:1px solid #3a3320;border-radius:20px;font-family:'Sarabun','Noto Sans Thai',Tahoma,Arial,sans-serif;color:#f6efe2;">
<tr><td style="padding:32px 32px 8px;text-align:center;">
<div style="font-size:12px;letter-spacing:4px;color:#f6c46a;">ADMIT ONE · บัตรเชิญ</div>
<div style="margin-top:20px;font-size:14px;color:#a9b0c2;">เรียนเชิญ</div>
<div style="margin-top:4px;font-size:26px;font-weight:700;color:#ffffff;">${esc(name)}</div>
<div style="margin-top:16px;font-size:14px;color:#a9b0c2;">ร่วมงาน</div>
<div style="margin-top:4px;font-size:26px;font-weight:700;color:#f6c46a;">${esc(event.title)}</div>
<p style="margin:20px 0 0;font-size:15px;line-height:1.7;color:#d8dbe4;">${esc(event.emailIntro).replace(/\n/g, '<br>')}</p>
</td></tr>
<tr><td style="padding:16px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#081127;border-radius:14px;">
${details.map(([k, v]) => `<tr><td style="padding:10px 16px;font-size:13px;color:#8d94a8;width:30%;">${esc(k)}</td><td style="padding:10px 16px;font-size:15px;color:#ffffff;">${esc(v)}</td></tr>`).join('')}
<tr><td style="padding:10px 16px;font-size:13px;color:#8d94a8;">หมายเลขบัตร</td><td style="padding:10px 16px;font-size:18px;letter-spacing:3px;color:#f8dca4;font-family:Consolas,Menlo,monospace;">${esc(ticket)}</td></tr>
</table>
</td></tr>
<tr><td style="padding:8px 32px 32px;text-align:center;">
<a href="${esc(ticketUrl)}" style="display:inline-block;background:#f6c46a;color:#1a1206;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:12px;">ดูบัตรเชิญ</a>
<div style="margin-top:16px;font-size:12px;color:#8d94a8;">${esc(event.ticketNote)}</div>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  return { subject, html, text };
}
