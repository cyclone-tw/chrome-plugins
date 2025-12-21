// Message types for communication between components
export type MessageType =
    | 'START_RECORDING'
    | 'STOP_RECORDING'
    | 'GET_STATUS'
    | 'NEW_MESSAGE'
    | 'EXPORT_DATA'
    | 'COPY_TO_CLIPBOARD'
    | 'UPLOAD_TO_DRIVE'
    | 'LOGIN_GOOGLE'
    | 'LOGOUT_GOOGLE'
    | 'GET_AUTH_STATUS'
    | 'CLEAR_MESSAGES'
    | 'PAGE_UNLOADING'
    | 'PENDING_RECOVERY'
    | 'OBSERVER_STARTED'
    | 'OBSERVER_STOPPED'
    | 'OBSERVER_ERROR'
    | 'MESSAGES_UPDATED';

// Base message interface
export interface BaseMessage {
    type: MessageType;
}

// Start recording message
export interface StartRecordingMessage extends BaseMessage {
    type: 'START_RECORDING';
    meetingId: string;
}

// Stop recording message
export interface StopRecordingMessage extends BaseMessage {
    type: 'STOP_RECORDING';
}

// Get status message
export interface GetStatusMessage extends BaseMessage {
    type: 'GET_STATUS';
}

// New message from content script
export interface NewMessageMessage extends BaseMessage {
    type: 'NEW_MESSAGE';
    payload: {
        id: string;
        timestamp: string;
        sender: string;
        content: string;
        capturedAt: number;
    };
}

// Export data message
export interface ExportDataMessage extends BaseMessage {
    type: 'EXPORT_DATA';
    format: 'md' | 'csv';
}

// Copy to clipboard message
export interface CopyToClipboardMessage extends BaseMessage {
    type: 'COPY_TO_CLIPBOARD';
    format: 'md' | 'csv';
}

// Upload to Drive message
export interface UploadToDriveMessage extends BaseMessage {
    type: 'UPLOAD_TO_DRIVE';
    format: 'md' | 'csv';
    folderId?: string;
}

// Login Google message
export interface LoginGoogleMessage extends BaseMessage {
    type: 'LOGIN_GOOGLE';
}

// Logout Google message
export interface LogoutGoogleMessage extends BaseMessage {
    type: 'LOGOUT_GOOGLE';
}

// Get auth status message
export interface GetAuthStatusMessage extends BaseMessage {
    type: 'GET_AUTH_STATUS';
}

// Union type for all messages
export type ExtensionMessage =
    | StartRecordingMessage
    | StopRecordingMessage
    | GetStatusMessage
    | NewMessageMessage
    | ExportDataMessage
    | CopyToClipboardMessage
    | UploadToDriveMessage
    | LoginGoogleMessage
    | LogoutGoogleMessage
    | GetAuthStatusMessage;

// Response types
export interface StatusResponse {
    isRecording: boolean;
    messageCount: number;
    meetingId: string | null;
    startedAt: number | null;
}

export interface AuthStatusResponse {
    isLoggedIn: boolean;
    userEmail: string | null;
}

export interface ExportResponse {
    success: boolean;
    error?: string;
}
