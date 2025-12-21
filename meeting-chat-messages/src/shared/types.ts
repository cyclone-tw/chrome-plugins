// Chat Message Type Definition
export interface ChatMessage {
    id: string;           // Unique message ID (hash-based)
    timestamp: string;    // Message send time
    sender: string;       // Sender name
    content: string;      // Message content
    capturedAt: number;   // Capture timestamp (epoch ms)
}

// Recording state
export interface RecordingState {
    isRecording: boolean;
    meetingId: string | null;
    startedAt: number | null;
    messageCount: number;
}

// Export format options
export type ExportFormat = 'md' | 'csv';

// User preferences
export interface UserPreferences {
    defaultFormat: ExportFormat;
    autoUploadToDrive: boolean;
    driveFolderId: string | null;
    driveFolderName: string | null;
}

// OAuth state
export interface AuthState {
    isLoggedIn: boolean;
    userEmail: string | null;
    accessToken: string | null;
}

// Storage keys
export const STORAGE_KEYS = {
    MESSAGES: 'chat_messages',
    RECORDING_STATE: 'recording_state',
    PREFERENCES: 'user_preferences',
    AUTH_STATE: 'auth_state',
    PENDING_UPLOAD: 'pending_upload',
} as const;
