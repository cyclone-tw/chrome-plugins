/**
 * Message hash utility
 * Generates unique IDs for chat messages to prevent duplicates
 */

/**
 * cyrb53 - A fast, high-quality 53-bit hash function
 * Based on: https://stackoverflow.com/a/52171480
 */
function cyrb53(str: string, seed = 0): number {
    let h1 = 0xdeadbeef ^ seed;
    let h2 = 0x41c6ce57 ^ seed;

    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }

    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/**
 * Generate a unique message ID based on content
 * @param timestamp - Message timestamp
 * @param sender - Sender name
 * @param content - Message content
 * @returns Hexadecimal hash string
 */
export function generateMessageId(
    timestamp: string,
    sender: string,
    content: string
): string {
    const raw = `${timestamp}-${sender}-${content}`;
    return cyrb53(raw).toString(16);
}

/**
 * Generate a meeting ID from the current URL
 * @param url - Google Meet URL
 * @returns Meeting ID or null
 */
export function extractMeetingId(url: string): string | null {
    try {
        const urlObj = new URL(url);
        // Google Meet URL format: https://meet.google.com/xxx-xxxx-xxx
        const pathname = urlObj.pathname;
        const match = pathname.match(/\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}
