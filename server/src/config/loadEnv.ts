import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';

// Keep the user's private server/.env. Fall back to its local backup if an
// earlier git pull removed the formerly tracked file; neither is committed.
const serverRoot = resolve(__dirname, '../..');
const primary = resolve(serverRoot, '.env');
const backup = resolve(serverRoot, '.env.backup');

if (existsSync(primary)) {
  const result = loadDotenv({ path: primary });
  if (result.error) console.error('[VILA config] Failed to read server/.env:', result.error.message);
} else if (existsSync(backup)) {
  const result = loadDotenv({ path: backup });
  if (result.error) console.error('[VILA config] Failed to read server/.env.backup:', result.error.message);
  else console.warn('[VILA config] server/.env is missing. Using your local .env.backup (not committed). Restore it as server/.env for normal operation.');
} else {
  console.warn('[VILA config] No server/.env found. SMTP will not send unless credentials are supplied via environment variables.');
}

const required = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
const missing = required.filter(key => !process.env[key]?.trim());
if (missing.length > 0) {
  console.warn('[VILA email] SMTP is NOT READY. Missing: ' + missing.join(', '));
} else if (/^(myemail|youraddress|replace-with|myemailpassword)/i.test(process.env.EMAIL_USER || '') ||
  /^(myemailpassword|replace-with|your-smtp)/i.test(process.env.EMAIL_PASS || '')) {
  console.warn('[VILA email] SMTP credentials look like example placeholders. Set actual SMTP credentials in server/.env.');
} else {
  console.info('[VILA email] SMTP configuration detected for ' + process.env.EMAIL_HOST + ':' + process.env.EMAIL_PORT + '. Run npm run email:test -- you@example.com to check connectivity and authentication.');
}
