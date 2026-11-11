import nodemailer from 'nodemailer';
import { resolve } from 'node:path';

type Message = { to: string; name: string; subject: string; heading: string; message: string; actionText?: string; actionUrl?: string };
const logoPath = resolve(__dirname, '../../assets/vila-logo.png');

function escapeHtml(input: string) {
  return input.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character] || character);
}

function appUrl(path: string) {
  const base = process.env.PUBLIC_APP_URL || process.env.CLIENT_ORIGIN || 'http://localhost:3000';
  return new URL(path, base.endsWith('/') ? base : base + '/').toString();
}

function template(message: Message) {
  const name = escapeHtml(message.name);
  const heading = escapeHtml(message.heading);
  const body = escapeHtml(message.message);
  const actionUrl = message.actionUrl ? escapeHtml(message.actionUrl) : null;
  const action = message.actionText && actionUrl
    ? `<tr><td align="center" style="padding:22px 0 12px"><a href="${actionUrl}" style="background:#2D9CDB;color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;padding:15px 24px;display:inline-block">${escapeHtml(message.actionText)}</a></td></tr>`
    : '';

  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:30px 12px;background:#F9FAFB;font-family:Arial,Helvetica,sans-serif;color:#1E293B">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e4e9ef;border-radius:18px">
<tr><td style="padding:30px 36px 15px"><img src="cid:vila-logo" width="54" height="54" alt="VILA" style="display:block;object-fit:contain;border:0"><div style="font-size:22px;font-weight:800;color:#2D9CDB;margin-top:10px">VILA<span style="color:#F2994A">.</span></div></td></tr>
<tr><td style="padding:10px 36px 5px"><h1 style="font-size:27px;line-height:1.25;margin:0;color:#1E293B">${heading}</h1></td></tr>
<tr><td style="padding:12px 36px 18px"><p style="font-size:15px;line-height:1.75;margin:0 0 14px">Hi ${name},</p><p style="font-size:15px;line-height:1.75;margin:0">${body}</p></td></tr>
${action ? `<tr><td style="padding:0 36px">${`<table role="presentation" width="100%"><tbody>${action}</tbody></table>`}</td></tr>` : ''}
<tr><td style="padding:25px 36px 32px"><p style="margin:0;color:#77869a;font-size:12px;line-height:1.7">Thanks for helping us build stronger communities.<br>— The VILA Team</p></td></tr>
</table>
<p style="text-align:center;color:#8290a0;font-size:11px;line-height:1.7;margin:18px auto;max-width:600px">VILA · Building connected communities, beginning in Abuloma, Nigeria.<br>This is a confirmation of an action you took on VILA.</p>
</body></html>`;
}

/** Email is sent only AFTER registration succeeds. Failures must never invalidate or repeat a saved registration. */
async function send(message: Message): Promise<boolean> {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const password = process.env.EMAIL_PASS;
  if (!host || !user || !password) {
    const missing = [!host && 'EMAIL_HOST', !user && 'EMAIL_USER', !password && 'EMAIL_PASS'].filter(Boolean).join(', ');
    console.error(`[VILA email] Not sent to ${message.to}: missing ${missing} in server/.env`);
    return false;
  }
  try {
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: password },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
    const result = await transport.sendMail({
      from: process.env.EMAIL_FROM || `"VILA" <${user}>`,
      to: message.to,
      subject: message.subject,
      text: `Hi ${message.name},\n\n${message.message}\n\n${message.actionText ? message.actionText + ': ' + message.actionUrl + '\n\n' : ''}Thanks,\nThe VILA Team`,
      html: template(message),
      attachments: [{ filename: 'vila-logo.png', path: logoPath, cid: 'vila-logo', contentDisposition: 'inline' }],
    });
    const accepted = (result.accepted || []).map(address => String(address).toLowerCase());
    const ok = accepted.includes(message.to.trim().toLowerCase());
    if (ok) {
      console.info(`[VILA email] SMTP accepted ${message.to}. Message ID: ${result.messageId}`);
    } else {
      console.error(`[VILA email] SMTP did not accept ${message.to}. Rejected recipients: ${(result.rejected || []).length}`);
    }
    return ok;
  } catch (error) {
    const failure = error as Error & { code?: string; responseCode?: number; command?: string };
    console.error('[VILA email] SMTP send failed:', {
      code: failure.code || 'UNKNOWN',
      responseCode: failure.responseCode,
      command: failure.command,
      message: failure.message,
    });
    return false;
  }
}

export function sendSignupEmail({ name, email, organizationName, organizationType }: {
  name: string; email: string; organizationName?: string; organizationType?: string;
}) {
  const attached = organizationName && organizationType;
  return send({
    to: email, name,
    subject: attached ? `Welcome to ${organizationName} on VILA!` : 'Welcome to the VILA waitlist!',
    heading: attached ? 'You are on the list!' : 'Welcome to VILA!',
    message: attached
      ? `You have successfully joined the VILA early-access waitlist through ${organizationName}. We will email you when VILA is ready. Joining via invitation does not verify membership in the ${organizationType}.`
      : 'You have successfully joined the VILA early-access waitlist. We will keep you posted as we prepare to launch!',
    actionText: 'Explore VILA',
    actionUrl: appUrl('/'),
  });
}

export function sendOrganizationCreatedEmail({ name, email, type, organizationName, slug }: {
  name: string; email: string; type: 'community' | 'group'; organizationName: string; slug: string;
}) {
  const invitePath = '/' + (type === 'community' ? 'c' : 'g') + '/' + slug;
  return send({
    to: email, name,
    subject: `Your VILA ${type} "${organizationName}" is ready!`,
    heading: 'Your people have a place on VILA!',
    message: `You have successfully created the ${type} "${organizationName}" on VILA. You are its creator and administrator. Share the invitation link below to welcome people to your ${type}. You can sign in with your email and password to manage registrations.`,
    actionText: 'Share your invitation',
    actionUrl: appUrl(invitePath),
  });
}

/** Local-only CLI helper; never expose this as a public API endpoint. */
export async function sendTestEmail(recipient: string) {
  return send({
    to: recipient,
    name: 'VILA tester',
    subject: 'VILA SMTP test — confirmation email',
    heading: 'Your VILA email is working!',
    message: 'This test confirms the VILA backend submitted a branded email to your SMTP provider. If you can read this message, email delivery is working.',
    actionText: 'Visit VILA',
    actionUrl: appUrl('/'),
  });
}
