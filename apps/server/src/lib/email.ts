import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM;

const resend = apiKey && from ? new Resend(apiKey) : null;

export const passwordResetEnabled = resend !== null;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendPasswordResetEmail(to: string, url: string): Promise<void> {
  if (!resend || !from) throw new Error('Email sending is not configured.');
  const text = [
    'Someone asked to reset the password for your HN Monthly Top account.',
    '',
    'Reset it here (the link works for one hour):',
    url,
    '',
    "If this wasn't you, you can ignore this email.",
  ].join('\n');
  const link = escapeHtml(url);
  const html = `<p>Someone asked to reset the password for your HN Monthly Top account.</p>
<p><a href="${link}">Reset your password</a> (the link works for one hour).</p>
<p>If the link doesn't work, paste this into your browser:<br>${link}</p>
<p>If this wasn't you, you can ignore this email.</p>`;
  const { error } = await resend.emails.send({
    from,
    to,
    subject: 'Reset your HN Monthly Top password',
    text,
    html,
  });
  if (error) throw new Error(`Resend: ${error.message}`);
}
