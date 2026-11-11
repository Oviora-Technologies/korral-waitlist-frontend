import './config/loadEnv';
import { sendTestEmail } from './services/emailService';

async function main() {
  const to = process.argv[2]?.trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    console.error('Usage: npm run email:test -- you@example.com');
    process.exitCode = 1;
    return;
  }
  console.log('[VILA email] Checking SMTP configuration from server/.env...');
  const ok = await sendTestEmail(to);
  if (ok) {
    console.log('[VILA email] SMTP accepted the test. Check your inbox and spam folder. Acceptance is not proof of final delivery.');
  } else {
    console.error('[VILA email] SMTP test failed. Review the error above and verify EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM.');
    process.exitCode = 1;
  }
}
main().catch(error => {
  console.error('[VILA email] Unexpected test error:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
