/**
 * Format converter utilities
 * Converts chat messages to Markdown and CSV formats
 */

import type { ChatMessage } from '@/shared/types';

/**
 * Format messages as Markdown
 * @param messages - Array of chat messages
 * @param meetingId - Optional meeting ID for header
 * @returns Markdown formatted string
 */
export function toMarkdown(messages: ChatMessage[], meetingId?: string): string {
    const date = new Date().toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    const header = `# Google Meet 聊天記錄

**會議 ID**: ${meetingId ?? '未知'}  
**匯出日期**: ${date}  
**訊息數量**: ${messages.length}

---

`;

    const body = messages
        .map((m) => `**[${m.timestamp}] ${m.sender}:**\n${m.content}`)
        .join('\n\n');

    return header + body;
}

/**
 * Format messages as CSV
 * @param messages - Array of chat messages
 * @returns CSV formatted string
 */
export function toCSV(messages: ChatMessage[]): string {
    const header = 'Timestamp,Sender,Content\n';

    const rows = messages
        .map((m) => {
            // Escape double quotes and wrap fields in quotes for CSV safety
            const timestamp = escapeCSV(m.timestamp);
            const sender = escapeCSV(m.sender);
            const content = escapeCSV(m.content);
            return `${timestamp},${sender},${content}`;
        })
        .join('\n');

    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    return BOM + header + rows;
}

/**
 * Escape a string for CSV format
 * @param value - String to escape
 * @returns Escaped string wrapped in quotes
 */
function escapeCSV(value: string): string {
    // Replace newlines with spaces
    const singleLine = value.replace(/[\r\n]+/g, ' ');
    // Escape double quotes by doubling them
    const escaped = singleLine.replace(/"/g, '""');
    return `"${escaped}"`;
}

/**
 * Generate a filename for the export
 * @param meetingId - Meeting ID
 * @param format - Export format
 * @returns Filename string
 */
export function generateFilename(meetingId: string | null, format: 'md' | 'csv'): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    const id = meetingId ?? 'unknown';

    return `meet-chat_${id}_${date}_${time}.${format}`;
}
