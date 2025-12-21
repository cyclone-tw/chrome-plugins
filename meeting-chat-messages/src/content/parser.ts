/**
 * DOM Parser for Google Meet chat messages
 * Extracts sender, timestamp, and content from chat message elements
 */

import type { ChatMessage } from '@/shared/types';
import { generateMessageId } from '@/utils/hash';

/**
 * Parse a single chat message element from the DOM
 * @param element - The DOM element representing a chat message
 * @returns ChatMessage object or null if parsing fails
 */
export function parseMessageElement(element: Element): ChatMessage | null {
    try {
        // Skip if this is a button element (buttons also have data-message-id)
        if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
            return null;
        }

        // Skip if already processed (marked by us)
        if (element.hasAttribute('data-mcl-processed')) {
            return null;
        }

        // Skip elements that don't have the message content structure
        const contentContainer = element.querySelector('[jsname="dTKtvb"]');
        if (!contentContainer) {
            return null;
        }

        // Extract message ID from data attribute
        const messageId = element.getAttribute('data-message-id') ?? '';

        // Extract content from the message container
        let content = '';
        const contentDiv = contentContainer.querySelector('div');
        if (contentDiv) {
            content = contentDiv.textContent?.trim() ?? '';
        }

        // Skip if no content or content is UI element
        if (!content || content === 'keep' || content.includes('將訊息置頂')) {
            return null;
        }

        // Mark element as processed to prevent duplicates
        element.setAttribute('data-mcl-processed', 'true');

        // Find sender name by looking up to the message group (.Ss4fHf)
        let sender = '您';  // Default for self messages
        const messageGroup = element.closest('.Ss4fHf');
        if (messageGroup) {
            // Look for sender name in .poVWob or .zWGUib
            const senderElement = messageGroup.querySelector('.poVWob, .zWGUib');
            if (senderElement) {
                sender = senderElement.textContent?.trim() ?? '參與者';
            }
        }

        // Generate timestamp
        const now = new Date();
        const timestamp = now.toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Generate unique ID - prefer Google's ID, fallback to content-based hash
        // Use content+timestamp for better uniqueness
        const id = messageId || generateMessageId(timestamp, sender, content);

        return {
            id,
            timestamp,
            sender,
            content,
            capturedAt: Date.now(),
        };
    } catch (error) {
        console.error('[Meet Chat Logger] Error parsing message:', error);
        return null;
    }
}

/**
 * Find the chat container element in the DOM
 * @returns The chat container element or null
 */
export function findChatContainer(): Element | null {
    // Primary selector for Google Meet chat
    const selectors = [
        '[aria-live="polite"]',
        '[role="log"]',
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            console.log('[Meet Chat Logger] Found chat container with selector:', selector);
            return element;
        }
    }

    return null;
}
