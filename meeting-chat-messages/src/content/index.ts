/**
 * Content Script Entry Point
 * Injected into Google Meet pages to monitor chat messages
 */

import { startObserver, stopObserver, isObserverRunning } from './observer';
import { extractMeetingId } from '@/utils/hash';
import { getRecordingState, setRecordingState, getMessages } from '@/utils/storage';
import type { ExtensionMessage, StatusResponse } from '@/shared/messages';

console.log('[Meet Chat Logger] Content script loaded');

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((
    message: ExtensionMessage,
    _sender,
    sendResponse: (response: unknown) => void
) => {
    handleMessage(message, sendResponse);
    return true; // Keep channel open for async response
});

/**
 * Handle incoming messages
 */
async function handleMessage(
    message: ExtensionMessage,
    sendResponse: (response: unknown) => void
): Promise<void> {
    switch (message.type) {
        case 'START_RECORDING': {
            console.log('[Meet Chat Logger] Starting recording...');

            const meetingId = extractMeetingId(window.location.href);
            const success = await startObserver();

            if (success) {
                await setRecordingState({
                    isRecording: true,
                    meetingId: meetingId,
                    startedAt: Date.now(),
                    messageCount: 0,
                });
            }

            sendResponse({ success, meetingId });
            break;
        }

        case 'STOP_RECORDING': {
            console.log('[Meet Chat Logger] Stopping recording...');

            stopObserver();

            const messages = await getMessages();
            const state = await getRecordingState();

            await setRecordingState({
                isRecording: false,
                meetingId: state.meetingId,
                startedAt: state.startedAt,
                messageCount: messages.length,
            });

            sendResponse({
                success: true,
                messageCount: messages.length
            });
            break;
        }

        case 'GET_STATUS': {
            const state = await getRecordingState();
            const messages = await getMessages();

            const response: StatusResponse = {
                isRecording: isObserverRunning(),
                messageCount: messages.length,
                meetingId: state.meetingId,
                startedAt: state.startedAt,
            };

            sendResponse(response);
            break;
        }

        default:
            sendResponse({ error: 'Unknown message type' });
    }
}

/**
 * Handle page unload - save any pending data
 */
window.addEventListener('beforeunload', async () => {
    if (isObserverRunning()) {
        stopObserver();

        const state = await getRecordingState();
        const messages = await getMessages();

        // Mark as interrupted so we can recover later
        await setRecordingState({
            isRecording: false,
            meetingId: state.meetingId,
            startedAt: state.startedAt,
            messageCount: messages.length,
        });

        // Notify background for potential recovery
        chrome.runtime.sendMessage({
            type: 'PAGE_UNLOADING',
            meetingId: state.meetingId,
            messageCount: messages.length,
        });
    }
});

/**
 * Check for recovery on load
 */
async function checkForRecovery(): Promise<void> {
    const state = await getRecordingState();

    // If there was a previous recording that didn't finish properly
    if (state.startedAt && !state.isRecording && state.messageCount > 0) {
        console.log('[Meet Chat Logger] Found previous recording with', state.messageCount, 'messages');

        // Notify background about pending data
        chrome.runtime.sendMessage({
            type: 'PENDING_RECOVERY',
            meetingId: state.meetingId,
            messageCount: state.messageCount,
        });
    }
}

// Run recovery check on load
checkForRecovery();
