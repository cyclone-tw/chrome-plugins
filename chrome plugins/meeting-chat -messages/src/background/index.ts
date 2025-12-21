/**
 * Background Service Worker
 * Handles OAuth, downloads, and Drive uploads
 */

import {
    getMessages,
    clearMessages,
    getRecordingState,
    setRecordingState,
    getAuthState,
    setAuthState,
    getPreferences,
    getPendingUpload,
    setPendingUpload,
} from '@/utils/storage';
import { toMarkdown, toCSV, generateFilename } from '@/utils/formatter';
import {
    getAuthToken,
    revokeAuthToken,
    getUserInfo,
    uploadFile,
    findOrCreateFolder
} from './drive';
import { EXTENSION_CONFIG } from '@/shared/constants';
import type { MessageType, AuthStatusResponse, ExportResponse } from '@/shared/messages';

// Message interface for background worker
interface BackgroundMessage {
    type: MessageType;
    format?: 'md' | 'csv';
    folderId?: string;
    meetingId?: string;
    messageCount?: number;
}

console.log('[Meet Chat Logger] Background service worker started');

// Listen for messages
chrome.runtime.onMessage.addListener((
    message: BackgroundMessage,
    sender,
    sendResponse
) => {
    handleMessage(message, sender, sendResponse);
    return true; // Keep channel open for async
});

/**
 * Handle incoming messages
 */
async function handleMessage(
    message: BackgroundMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
): Promise<void> {
    switch (message.type) {
        case 'LOGIN_GOOGLE': {
            const result = await handleGoogleLogin();
            sendResponse(result);
            break;
        }

        case 'LOGOUT_GOOGLE': {
            await handleGoogleLogout();
            sendResponse({ success: true });
            break;
        }

        case 'GET_AUTH_STATUS': {
            const authState = await getAuthState();
            const response: AuthStatusResponse = {
                isLoggedIn: authState.isLoggedIn,
                userEmail: authState.userEmail,
            };
            sendResponse(response);
            break;
        }

        case 'EXPORT_DATA': {
            const result = await handleExport(message.format ?? 'md');
            sendResponse(result);
            break;
        }

        case 'UPLOAD_TO_DRIVE': {
            const result = await handleDriveUpload(message.format ?? 'md', message.folderId);
            sendResponse(result);
            break;
        }

        case 'CLEAR_MESSAGES': {
            await clearMessages();
            await setRecordingState({
                isRecording: false,
                meetingId: null,
                startedAt: null,
                messageCount: 0,
            });
            sendResponse({ success: true });
            break;
        }

        case 'PAGE_UNLOADING': {
            // Handle page close - save for recovery
            const messages = await getMessages();
            if (messages.length > 0) {
                const state = await getRecordingState();
                await setPendingUpload({
                    meetingId: state.meetingId ?? 'unknown',
                    messages,
                    endedAt: Date.now(),
                });
            }
            sendResponse({ success: true });
            break;
        }

        case 'PENDING_RECOVERY':
        case 'OBSERVER_STARTED':
        case 'OBSERVER_STOPPED':
        case 'OBSERVER_ERROR':
        case 'MESSAGES_UPDATED': {
            // These are informational messages, no response needed
            sendResponse({ acknowledged: true });
            break;
        }

        default:
            sendResponse({ error: 'Unknown message type in background' });
    }
}

/**
 * Handle Google login
 */
async function handleGoogleLogin(): Promise<{ success: boolean; email?: string; error?: string }> {
    try {
        const token = await getAuthToken(true);

        if (!token) {
            return { success: false, error: 'Failed to get auth token' };
        }

        const userInfo = await getUserInfo(token);

        if (!userInfo) {
            return { success: false, error: 'Failed to get user info' };
        }

        await setAuthState({
            isLoggedIn: true,
            userEmail: userInfo.email,
            accessToken: token,
        });

        return { success: true, email: userInfo.email };

    } catch (error) {
        console.error('[Meet Chat Logger] Login error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Login failed'
        };
    }
}

/**
 * Handle Google logout
 */
async function handleGoogleLogout(): Promise<void> {
    await revokeAuthToken();
    await setAuthState({
        isLoggedIn: false,
        userEmail: null,
        accessToken: null,
    });
}

/**
 * Handle local file export (download)
 */
async function handleExport(format: 'md' | 'csv'): Promise<ExportResponse> {
    try {
        const messages = await getMessages();

        if (messages.length === 0) {
            return { success: false, error: 'No messages to export' };
        }

        const state = await getRecordingState();
        const content = format === 'md'
            ? toMarkdown(messages, state.meetingId ?? undefined)
            : toCSV(messages);

        const filename = generateFilename(state.meetingId, format);
        const mimeType = format === 'md' ? 'text/markdown' : 'text/csv';

        // Create blob URL
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        // Download
        await chrome.downloads.download({
            url,
            filename,
            saveAs: true,
        });

        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 60000);

        return { success: true };

    } catch (error) {
        console.error('[Meet Chat Logger] Export error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Export failed'
        };
    }
}

/**
 * Handle Google Drive upload
 */
async function handleDriveUpload(
    format: 'md' | 'csv',
    folderId?: string
): Promise<ExportResponse> {
    try {
        const authState = await getAuthState();

        if (!authState.isLoggedIn || !authState.accessToken) {
            return { success: false, error: 'Not logged in to Google' };
        }

        const messages = await getMessages();

        if (messages.length === 0) {
            return { success: false, error: 'No messages to upload' };
        }

        const state = await getRecordingState();
        const content = format === 'md'
            ? toMarkdown(messages, state.meetingId ?? undefined)
            : toCSV(messages);

        const filename = generateFilename(state.meetingId, format);
        const mimeType = format === 'md' ? 'text/markdown' : 'text/csv';

        // Get or create folder
        let targetFolderId = folderId;
        if (!targetFolderId) {
            const prefs = await getPreferences();
            if (prefs.driveFolderId) {
                targetFolderId = prefs.driveFolderId;
            } else {
                // Create default folder
                targetFolderId = await findOrCreateFolder(
                    authState.accessToken,
                    EXTENSION_CONFIG.DEFAULT_DRIVE_FOLDER
                ) ?? undefined;
            }
        }

        // Upload
        const result = await uploadFile(
            authState.accessToken,
            filename,
            content,
            mimeType,
            targetFolderId
        );

        if (result.success) {
            // Clear pending upload if any
            await setPendingUpload(null);
        }

        return result;

    } catch (error) {
        console.error('[Meet Chat Logger] Drive upload error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        };
    }
}

/**
 * Check for pending uploads on startup
 */
async function checkPendingUploads(): Promise<void> {
    const pending = await getPendingUpload();

    if (pending) {
        console.log('[Meet Chat Logger] Found pending upload:', pending.meetingId);
        // We'll notify the user via the popup when they open it
    }
}

// Run startup checks
checkPendingUploads();
