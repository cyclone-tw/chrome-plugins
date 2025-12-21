/**
 * MutationObserver for Google Meet chat messages
 * Monitors the DOM for new chat messages and saves them to storage
 */

import { EXTENSION_CONFIG } from '@/shared/constants';
import type { ChatMessage } from '@/shared/types';
import { saveMessage, getMessages, updateMessageCount } from '@/utils/storage';
import { findChatContainer, parseMessageElement } from './parser';

let observer: MutationObserver | null = null;
let isObserving = false;
let retryCount = 0;
let retryTimer: number | null = null;
let processedIds = new Set<string>();

/**
 * Start observing the chat container for new messages
 */
export async function startObserver(): Promise<boolean> {
    if (isObserving) {
        console.log('[Meet Chat Logger] Observer already running');
        return true;
    }

    // Load existing message IDs to avoid duplicates
    const existingMessages = await getMessages();
    processedIds = new Set(existingMessages.map(m => m.id));

    const container = findChatContainer();

    if (!container) {
        console.log('[Meet Chat Logger] Chat container not found, will retry...');
        scheduleRetry();
        return false;
    }

    console.log('[Meet Chat Logger] Starting observer on chat container');

    // Create the observer
    observer = new MutationObserver(handleMutations);

    // Start observing
    observer.observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
    });

    isObserving = true;
    retryCount = 0;

    // Also capture any existing messages
    await captureExistingMessages(container);

    // Notify background script
    chrome.runtime.sendMessage({ type: 'OBSERVER_STARTED' });

    return true;
}

/**
 * Stop observing the chat container
 */
export function stopObserver(): void {
    if (observer) {
        observer.disconnect();
        observer = null;
    }

    if (retryTimer !== null) {
        clearTimeout(retryTimer);
        retryTimer = null;
    }

    isObserving = false;
    processedIds.clear();

    console.log('[Meet Chat Logger] Observer stopped');

    // Notify background script
    chrome.runtime.sendMessage({ type: 'OBSERVER_STOPPED' });
}

/**
 * Check if the observer is currently running
 */
export function isObserverRunning(): boolean {
    return isObserving;
}

/**
 * Schedule a retry to find the chat container
 */
function scheduleRetry(): void {
    if (retryCount >= EXTENSION_CONFIG.MAX_OBSERVER_RETRIES) {
        console.error('[Meet Chat Logger] Max retries reached, giving up');
        chrome.runtime.sendMessage({
            type: 'OBSERVER_ERROR',
            error: 'Chat container not found'
        });
        return;
    }

    retryCount++;
    console.log(`[Meet Chat Logger] Retry ${retryCount}/${EXTENSION_CONFIG.MAX_OBSERVER_RETRIES}`);

    retryTimer = window.setTimeout(() => {
        startObserver();
    }, EXTENSION_CONFIG.OBSERVER_RETRY_INTERVAL_MS);
}

/**
 * Handle DOM mutations
 */
let mutationDebounceTimer: number | null = null;
const pendingMutations: MutationRecord[] = [];

function handleMutations(mutations: MutationRecord[]): void {
    pendingMutations.push(...mutations);

    // Debounce processing to avoid excessive CPU usage
    if (mutationDebounceTimer !== null) {
        clearTimeout(mutationDebounceTimer);
    }

    mutationDebounceTimer = window.setTimeout(() => {
        processPendingMutations();
    }, EXTENSION_CONFIG.MUTATION_DEBOUNCE_MS);
}

/**
 * Process pending mutations
 */
async function processPendingMutations(): Promise<void> {
    const mutations = [...pendingMutations];
    pendingMutations.length = 0;

    const newMessages: ChatMessage[] = [];

    for (const mutation of mutations) {
        if (mutation.type === 'childList') {
            for (const node of mutation.addedNodes) {
                if (node instanceof Element) {
                    // Only select DIV elements with data-message-id (not BUTTON)
                    const messageElements = node.matches('div[data-message-id]')
                        ? [node]
                        : Array.from(node.querySelectorAll('div[data-message-id]'));

                    for (const msgElement of messageElements) {
                        // Skip if already processed via DOM attribute
                        if (msgElement.hasAttribute('data-mcl-processed')) continue;

                        const message = parseMessageElement(msgElement);
                        if (message && !processedIds.has(message.id)) {
                            processedIds.add(message.id);
                            newMessages.push(message);
                        }
                    }
                }
            }
        }
    }

    // Save new messages and update count
    if (newMessages.length > 0) {
        console.log(`[Meet Chat Logger] Captured ${newMessages.length} new messages`);

        for (const msg of newMessages) {
            await saveMessage(msg);
        }

        // Update message count
        const allMessages = await getMessages();
        await updateMessageCount(allMessages.length);

        // Notify popup of update
        chrome.runtime.sendMessage({
            type: 'MESSAGES_UPDATED',
            count: allMessages.length
        });
    }
}

/**
 * Capture any existing messages in the chat container
 */
async function captureExistingMessages(container: Element): Promise<void> {
    // Only select DIV elements with data-message-id (not BUTTON)
    const messageElements = container.querySelectorAll('div[data-message-id]');
    const newMessages: ChatMessage[] = [];

    for (const element of messageElements) {
        // Skip if already processed
        if (element.hasAttribute('data-mcl-processed')) continue;

        const message = parseMessageElement(element);
        if (message && !processedIds.has(message.id)) {
            processedIds.add(message.id);
            newMessages.push(message);
        }
    }

    if (newMessages.length > 0) {
        console.log(`[Meet Chat Logger] Captured ${newMessages.length} existing messages`);

        for (const msg of newMessages) {
            await saveMessage(msg);
        }

        const allMessages = await getMessages();
        await updateMessageCount(allMessages.length);
    }
}
