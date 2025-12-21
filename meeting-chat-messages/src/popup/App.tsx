import { useState, useEffect, useCallback } from 'react';

// Local type definitions
type ExportFormat = 'md' | 'csv';

interface StatusResponse {
    isRecording: boolean;
    messageCount: number;
    meetingId: string | null;
    startedAt: number | null;
}

interface AuthStatusResponse {
    isLoggedIn: boolean;
    userEmail: string | null;
}

// Icons as SVG components
const ChatIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
    </svg>
);

const DownloadIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
    </svg>
);

const CopyIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
    </svg>
);

const DriveIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.71 3.5L1.15 15l4.58 7.5h13.54l4.58-7.5L17.29 3.5H7.71zm8.58 2l4.15 7H8.56l-4.15-7h11.88zm-4.29 9l3.85 6.5H8.15L4.3 14.5h7.7z" />
    </svg>
);

const GoogleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
    </svg>
);

function App() {
    const [isRecording, setIsRecording] = useState(false);
    const [messageCount, setMessageCount] = useState(0);
    const [meetingId, setMeetingId] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('md');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isOnMeetPage, setIsOnMeetPage] = useState(false);

    // Check current tab and load status
    useEffect(() => {
        const loadStatus = async () => {
            try {
                // Check if on Google Meet page
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                const isMeet = tab?.url?.includes('meet.google.com');
                setIsOnMeetPage(isMeet ?? false);

                if (isMeet && tab.id) {
                    // Get recording status from content script
                    const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_STATUS' }) as StatusResponse;
                    setIsRecording(response.isRecording);
                    setMessageCount(response.messageCount);
                    setMeetingId(response.meetingId);
                }

                // Get auth status
                const authResponse = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' }) as AuthStatusResponse;
                setIsLoggedIn(authResponse.isLoggedIn);
                setUserEmail(authResponse.userEmail);
            } catch (err) {
                console.error('Error loading status:', err);
            }
        };

        loadStatus();

        // Listen for message updates
        const handleMessage = (message: { type: string; count?: number }) => {
            if (message.type === 'MESSAGES_UPDATED' && message.count !== undefined) {
                setMessageCount(message.count);
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);
        return () => chrome.runtime.onMessage.removeListener(handleMessage);
    }, []);

    // Start/Stop recording
    const toggleRecording = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab.id) throw new Error('No active tab');

            const messageType = isRecording ? 'STOP_RECORDING' : 'START_RECORDING';
            const response = await chrome.tabs.sendMessage(tab.id, { type: messageType });

            if (response.success) {
                setIsRecording(!isRecording);
                if (response.meetingId) setMeetingId(response.meetingId);
                if (response.messageCount !== undefined) setMessageCount(response.messageCount);
            } else {
                throw new Error(response.error ?? 'Operation failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to toggle recording');
        } finally {
            setIsLoading(false);
        }
    }, [isRecording]);

    // Export to local file
    const handleExport = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await chrome.runtime.sendMessage({
                type: 'EXPORT_DATA',
                format: selectedFormat
            });

            if (response.success) {
                setSuccess('檔案已開始下載');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                throw new Error(response.error ?? 'Export failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Export failed');
        } finally {
            setIsLoading(false);
        }
    }, [selectedFormat]);

    // Copy to clipboard
    const handleCopy = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Get messages from storage
            const result = await chrome.storage.local.get(['chat_messages']) as {
                chat_messages?: Array<{ timestamp: string; sender: string; content: string }>
            };
            const messages = result.chat_messages ?? [];

            if (messages.length === 0) {
                throw new Error('沒有訊息可複製');
            }

            // Format content
            let content: string;
            if (selectedFormat === 'md') {
                content = messages.map((m: { timestamp: string; sender: string; content: string }) =>
                    `**[${m.timestamp}] ${m.sender}:**\n${m.content}`
                ).join('\n\n');
            } else {
                content = `Timestamp,Sender,Content\n` +
                    messages.map((m: { timestamp: string; sender: string; content: string }) =>
                        `"${m.timestamp}","${m.sender}","${m.content.replace(/"/g, '""')}"`
                    ).join('\n');
            }

            await navigator.clipboard.writeText(content);
            setSuccess('已複製到剪貼簿');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Copy failed');
        } finally {
            setIsLoading(false);
        }
    }, [selectedFormat]);

    // Upload to Google Drive
    const handleDriveUpload = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await chrome.runtime.sendMessage({
                type: 'UPLOAD_TO_DRIVE',
                format: selectedFormat
            });

            if (response.success) {
                setSuccess('已上傳至 Google Drive');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                throw new Error(response.error ?? 'Upload failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setIsLoading(false);
        }
    }, [selectedFormat]);

    // Google login
    const handleGoogleLogin = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await chrome.runtime.sendMessage({ type: 'LOGIN_GOOGLE' });

            if (response.success) {
                setIsLoggedIn(true);
                setUserEmail(response.email);
            } else {
                throw new Error(response.error ?? 'Login failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Google logout
    const handleGoogleLogout = useCallback(async () => {
        try {
            await chrome.runtime.sendMessage({ type: 'LOGOUT_GOOGLE' });
            setIsLoggedIn(false);
            setUserEmail(null);
        } catch (err) {
            console.error('Logout error:', err);
        }
    }, []);

    // Clear messages
    const handleClear = useCallback(async () => {
        if (!confirm('確定要清除所有訊息嗎？')) return;

        try {
            await chrome.runtime.sendMessage({ type: 'CLEAR_MESSAGES' });
            setMessageCount(0);
            setSuccess('訊息已清除');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Clear failed');
        }
    }, []);

    return (
        <div className="popup-container">
            {/* Header */}
            <div className="header">
                <div className="header-icon">
                    <ChatIcon />
                </div>
                <h1 className="header-title">Meet Chat Logger</h1>
            </div>

            {/* Status Card */}
            <div className="status-card">
                <div className="status-indicator">
                    <div className={`status-dot ${isRecording ? 'recording' : 'idle'}`} />
                    <span className="status-text">
                        {isRecording ? '監聽中...' : '未開始'}
                    </span>
                </div>

                <div className="message-count">{messageCount}</div>
                <div className="message-label">則訊息已擷取</div>

                {meetingId && (
                    <div className="message-label" style={{ marginTop: 8 }}>
                        會議: {meetingId}
                    </div>
                )}
            </div>

            {/* Not on Meet Page Warning */}
            {!isOnMeetPage && (
                <div className="alert alert-warning">
                    ⚠️ 請在 Google Meet 頁面使用此擴充功能
                </div>
            )}

            {/* Recording Controls - Always visible on Meet page */}
            {isOnMeetPage && (
                <button
                    className={`btn ${isRecording ? 'btn-danger' : 'btn-success'}`}
                    onClick={toggleRecording}
                    disabled={isLoading}
                    style={{ marginTop: 4, marginBottom: 4 }}
                >
                    {isRecording ? '⏹️ 停止監聽' : '▶️ 開始監聽'}
                </button>
            )}

            {/* Show button hint if not on Meet page */}
            {!isOnMeetPage && (
                <button
                    className="btn btn-secondary"
                    disabled
                    style={{ marginTop: 4 }}
                >
                    請前往 Google Meet 頁面
                </button>
            )}

            {/* Format Selector */}
            {messageCount > 0 && (
                <>
                    <div className="format-selector">
                        <button
                            className={`format-btn ${selectedFormat === 'md' ? 'active' : ''}`}
                            onClick={() => setSelectedFormat('md')}
                        >
                            Markdown
                        </button>
                        <button
                            className={`format-btn ${selectedFormat === 'csv' ? 'active' : ''}`}
                            onClick={() => setSelectedFormat('csv')}
                        >
                            CSV
                        </button>
                    </div>

                    {/* Export Actions */}
                    <div className="button-group">
                        <div className="button-row">
                            <button className="btn btn-primary" onClick={handleExport} disabled={isLoading}>
                                <DownloadIcon /> 下載
                            </button>
                            <button className="btn btn-secondary" onClick={handleCopy} disabled={isLoading}>
                                <CopyIcon /> 複製
                            </button>
                        </div>

                        {isLoggedIn && (
                            <button className="btn btn-secondary" onClick={handleDriveUpload} disabled={isLoading}>
                                <DriveIcon /> 上傳至 Google Drive
                            </button>
                        )}

                        <button
                            className="btn btn-secondary"
                            onClick={handleClear}
                            disabled={isLoading || isRecording}
                            style={{ fontSize: 12, padding: '8px 12px' }}
                        >
                            清除訊息
                        </button>
                    </div>
                </>
            )}

            <div className="divider" />

            {/* Google Auth Section */}
            <div className="auth-section">
                <div className="auth-header">
                    <span className="auth-title">Google Drive 雲端備份</span>
                </div>

                {isLoggedIn ? (
                    <div>
                        <div className="auth-email">{userEmail}</div>
                        <button
                            className="btn btn-secondary"
                            onClick={handleGoogleLogout}
                            style={{ marginTop: 8, fontSize: 12 }}
                        >
                            登出
                        </button>
                    </div>
                ) : (
                    <button className="btn btn-primary" onClick={handleGoogleLogin} disabled={isLoading}>
                        <GoogleIcon /> 連結 Google 帳號
                    </button>
                )}
            </div>

            {/* Alerts */}
            {error && (
                <div className="alert alert-error">
                    ❌ {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    ✅ {success}
                </div>
            )}

            {/* Footer */}
            <div className="footer">
                Meet Chat Logger Pro v1.0.0
            </div>
        </div>
    );
}

export default App;
