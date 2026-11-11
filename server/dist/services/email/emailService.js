'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.sendSignupEmail = sendSignupEmail;
exports.sendOrganizationCreatedEmail = sendOrganizationCreatedEmail;
exports.sendTestEmail = sendTestEmail;
const nodemailer_1 = __importDefault(require('nodemailer'));
const node_path_1 = require('node:path');
const emailTemplate_1 = require('./template/emailTemplate');
const logoPath = (0, node_path_1.resolve)(
  __dirname,
  '../../assets/vila-logo.png',
);
function appUrl(path) {
  const base =
    process.env.PUBLIC_APP_URL ||
    process.env.CLIENT_ORIGIN ||
    'http://localhost:3000';
  return new URL(path, base.endsWith('/') ? base : base + '/').toString();
}
/** Email is sent only AFTER registration succeeds. Failures must never invalidate or repeat a saved registration. */
async function send(message, verifyOnly = false) {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const password = process.env.EMAIL_PASS;
  if (!host || !user || !password) {
    const missing = [
      !host && 'EMAIL_HOST',
      !user && 'EMAIL_USER',
      !password && 'EMAIL_PASS',
    ]
      .filter(Boolean)
      .join(', ');
    console.error(
      `[VILA email] Not sent to ${message.to}: missing ${missing} in server/.env`,
    );
    return false;
  }
  try {
    const transport = nodemailer_1.default.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: password },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
    if (verifyOnly) {
      try {
        await transport.verify();
        return true;
      } finally {
        transport.close();
      }
    }
    const result = await transport.sendMail({
      from: process.env.EMAIL_FROM || `"VILA" <${user}>`,
      to: message.to,
      subject: message.subject,
      text: `Hi ${message.name},\n\n${message.message}\n\n${message.actionText ? message.actionText + ': ' + message.actionUrl + '\n\n' : ''}Thanks,\nThe VILA Team`,
      html: (0, emailTemplate_1.renderEmail)(message),
      attachments: [
        {
          filename: 'vila-logo.png',
          path: logoPath,
          cid: 'vila-logo',
          contentDisposition: 'inline',
        },
      ],
    });
    const accepted = (result.accepted || []).map((address) =>
      String(address).toLowerCase(),
    );
    const ok = accepted.includes(message.to.trim().toLowerCase());
    if (ok) {
      console.info(
        `[VILA email] SMTP accepted ${message.to}. Message ID: ${result.messageId}`,
      );
    } else {
      console.error(
        `[VILA email] SMTP did not accept ${message.to}. Rejected recipients: ${(result.rejected || []).length}`,
      );
    }
    return ok;
  } catch (error) {
    const failure = error;
    console.error('[VILA email] SMTP send failed:', {
      code: failure.code || 'UNKNOWN',
      responseCode: failure.responseCode,
      command: failure.command,
      message: failure.message,
    });
    if (failure.code === 'EAUTH') {
      console.error(
        host === 'smtp.gmail.com'
          ? '[VILA email] Gmail rejected the credentials. Enable 2-Step Verification and create an App Password at https://myaccount.google.com/apppasswords for EMAIL_USER. Save it as EMAIL_PASS in server/.env, then restart the server. Do not use your regular Google password.'
          : '[VILA email] The SMTP provider rejected EMAIL_USER or EMAIL_PASS. Update the credentials and restart the server.',
      );
    }
    return false;
  }
}
function sendSignupEmail({ name, email, organizationName, organizationType }) {
  const attached = organizationName && organizationType;
  return send({
    to: email,
    name,
    subject: attached
      ? `Welcome to ${organizationName} on VILA!`
      : 'Welcome to the VILA waitlist!',
    heading: attached ? 'You are on the list!' : 'Welcome to VILA!',
    message: attached
      ? `You have successfully joined the VILA early-access waitlist through ${organizationName}. We will email you when VILA is ready. `
      : 'You have successfully joined the VILA early-access waitlist. We will keep you posted as we prepare to launch!',
    // actionText: 'Explore VILA',
    // actionUrl: appUrl('/'),
  });
}
function sendOrganizationCreatedEmail({
  name,
  email,
  type,
  organizationName,
  slug,
}) {
  const invitePath = '/' + (type === 'community' ? 'c' : 'g') + '/' + slug;
  return send({
    to: email,
    name,
    subject: `Your VILA ${type} "${organizationName}" is ready!`,
    heading: 'Your people have a place on VILA!',
    message: `You have successfully created the ${type} "${organizationName}" on VILA. You are its creator and administrator. Share the invitation link below to welcome people to your ${type}. You can sign in with your email and password to manage registrations.`,
    actionText: 'Share your invitation',
    actionUrl: appUrl(invitePath),
  });
}
/** Local-only CLI helper; never expose this as a public API endpoint. */
async function sendTestEmail(recipient, verifyOnly = false) {
  return send(
    {
      to: recipient,
      name: 'VILA tester',
      subject: 'VILA SMTP test — confirmation email',
      heading: 'Your VILA email is working!',
      message:
        'This test confirms the VILA backend submitted a branded email to your SMTP provider. If you can read this message, email delivery is working.',
      actionText: 'Visit VILA',
      actionUrl: appUrl('/'),
    },
    verifyOnly,
  );
}
