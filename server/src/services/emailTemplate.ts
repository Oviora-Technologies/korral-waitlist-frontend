import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type EmailContent = {
  name: string;
  heading: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
};

function escapeHtml(input: string) {
  return input.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] || character);
}

export function renderEmail(message: EmailContent): string {
  // Assets live outside src/dist so this path works in development and builds.
  const source = readFileSync(resolve(__dirname, '../../assets/emails/confirmation.html'), 'utf8');
  const values: Record<string, string> = {
    name: message.name,
    heading: message.heading,
    body: message.message,
    actionText: message.actionText || '',
    actionUrl: message.actionUrl || '',
  };

  return source
    .replace(/<!-- BEGIN ACTION -->([\s\S]*?)<!-- END ACTION -->/g,
      (_match, content: string) => message.actionText && message.actionUrl ? content : '')
    .replace(/{{(name|heading|body|actionText|actionUrl)}}/g,
      (_match, key: string) => escapeHtml(values[key]));
}
