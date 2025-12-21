// DOM Selectors for Google Meet chat elements
// NOTE: These selectors should be verified against actual Google Meet DOM structure
// Google Meet uses obfuscated class names, so we rely on ARIA attributes and data attributes

export const MEET_SELECTORS = {
    // Chat panel container - uses role="log" as it's a live region
    CHAT_CONTAINER: '[role="log"]',

    // Individual message item
    MESSAGE_ITEM: '[role="listitem"]',

    // Alternative selectors to try if primary ones fail
    ALT_CHAT_CONTAINER: '[data-panel-id="1"]',
    ALT_MESSAGE_CONTAINER: '[jscontroller]',
} as const;

// Extension constants
export const EXTENSION_CONFIG = {
    // Storage limits
    MAX_MESSAGES_STORED: 10000,

    // Debounce timing for DOM mutations (ms)
    MUTATION_DEBOUNCE_MS: 100,

    // Retry settings for DOM observation
    OBSERVER_RETRY_INTERVAL_MS: 2000,
    MAX_OBSERVER_RETRIES: 30,

    // File naming
    FILE_PREFIX: 'meet-chat',

    // Google Drive folder name (if auto-creating)
    DEFAULT_DRIVE_FOLDER: 'Meet Chat Logs',
} as const;

// Google API endpoints
export const GOOGLE_API = {
    DRIVE_UPLOAD: 'https://www.googleapis.com/upload/drive/v3/files',
    DRIVE_FILES: 'https://www.googleapis.com/drive/v3/files',
    USER_INFO: 'https://www.googleapis.com/oauth2/v2/userinfo',
} as const;
