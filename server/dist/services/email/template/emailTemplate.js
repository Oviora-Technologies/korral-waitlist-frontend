"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderEmail = renderEmail;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
function escapeHtml(input) {
    return input.replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character] || character);
}
function renderEmail(message) {
    // Assets live outside src/dist so this path works in development and builds.
    const source = (0, node_fs_1.readFileSync)((0, node_path_1.resolve)(__dirname, '../../assets/emails/confirmation.html'), 'utf8');
    const values = {
        name: message.name,
        heading: message.heading,
        body: message.message,
        actionText: message.actionText || '',
        actionUrl: message.actionUrl || '',
    };
    return source
        .replace(/<!-- BEGIN ACTION -->([\s\S]*?)<!-- END ACTION -->/g, (_match, content) => message.actionText && message.actionUrl ? content : '')
        .replace(/{{(name|heading|body|actionText|actionUrl)}}/g, (_match, key) => escapeHtml(values[key]));
}
