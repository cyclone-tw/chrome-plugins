/**
 * Chrome Storage wrapper utilities
 * Provides typed access to chrome.storage.local
 */

import type {
    ChatMessage,
    RecordingState,
    UserPreferences,
    AuthState,
} from '@/shared/types';
import { STORAGE_KEYS } from '@/shared/types';

// Generic storage getter
async function getFromStorage<T>(key: string): Promise<T | null> {
    return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
            const value = result[key];
            resolve(value !== undefined ? (value as T) : null);
        });
    });
}

// Generic storage setter
async function setToStorage<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => {
            resolve();
        });
    });
}

// Messages
export async function getMessages(): Promise<ChatMessage[]> {
    return (await getFromStorage<ChatMessage[]>(STORAGE_KEYS.MESSAGES)) ?? [];
}

export async function saveMessage(message: ChatMessage): Promise<void> {
    const messages = await getMessages();

    // Check for duplicates by ID
    const existsById = messages.some(m => m.id === message.id);
    if (existsById) {
        return;
    }

    // Also check for same content within recent messages (last 30 seconds)
    // This helps prevent duplicates when DOM re-renders the same message
    const recentThreshold = 30000; // 30 seconds
    const existsByContent = messages.some(m =>
        m.content === message.content &&
        Math.abs(m.capturedAt - message.capturedAt) < recentThreshold
    );

    if (existsByContent) {
        console.log('[Meet Chat Logger] Skipping duplicate content:', message.content.slice(0, 30));
        return;
    }

    messages.push(message);
    await setToStorage(STORAGE_KEYS.MESSAGES, messages);
}

export async function clearMessages(): Promise<void> {
    await setToStorage(STORAGE_KEYS.MESSAGES, []);
}

// Recording State
export async function getRecordingState(): Promise<RecordingState> {
    const state = await getFromStorage<RecordingState>(STORAGE_KEYS.RECORDING_STATE);
    return state ?? {
        isRecording: false,
        meetingId: null,
        startedAt: null,
        messageCount: 0,
    };
}

export async function setRecordingState(state: RecordingState): Promise<void> {
    await setToStorage(STORAGE_KEYS.RECORDING_STATE, state);
}

export async function updateMessageCount(count: number): Promise<void> {
    const state = await getRecordingState();
    state.messageCount = count;
    await setRecordingState(state);
}

// User Preferences
export async function getPreferences(): Promise<UserPreferences> {
    const prefs = await getFromStorage<UserPreferences>(STORAGE_KEYS.PREFERENCES);
    return prefs ?? {
        defaultFormat: 'md',
        autoUploadToDrive: false,
        driveFolderId: null,
        driveFolderName: null,
    };
}

export async function setPreferences(prefs: UserPreferences): Promise<void> {
    await setToStorage(STORAGE_KEYS.PREFERENCES, prefs);
}

// Auth State
export async function getAuthState(): Promise<AuthState> {
    const auth = await getFromStorage<AuthState>(STORAGE_KEYS.AUTH_STATE);
    return auth ?? {
        isLoggedIn: false,
        userEmail: null,
        accessToken: null,
    };
}

export async function setAuthState(auth: AuthState): Promise<void> {
    await setToStorage(STORAGE_KEYS.AUTH_STATE, auth);
}

// Pending Upload (for crash recovery)
export interface PendingUpload {
    meetingId: string;
    messages: ChatMessage[];
    endedAt: number;
}

export async function getPendingUpload(): Promise<PendingUpload | null> {
    return getFromStorage<PendingUpload>(STORAGE_KEYS.PENDING_UPLOAD);
}

export async function setPendingUpload(data: PendingUpload | null): Promise<void> {
    if (data === null) {
        await chrome.storage.local.remove(STORAGE_KEYS.PENDING_UPLOAD);
    } else {
        await setToStorage(STORAGE_KEYS.PENDING_UPLOAD, data);
    }
}
