/**
 * Google Drive API integration
 * Handles file uploads to Google Drive
 */

import { GOOGLE_API } from '@/shared/constants';

/**
 * Get Google OAuth access token
 * Uses chrome.identity API for authentication
 */
export async function getAuthToken(interactive = true): Promise<string | null> {
    try {
        const result = await chrome.identity.getAuthToken({ interactive });
        return result.token ?? null;
    } catch (error) {
        console.error('[Meet Chat Logger] Auth error:', error);
        return null;
    }
}

/**
 * Revoke the current access token (logout)
 */
export async function revokeAuthToken(): Promise<void> {
    const token = await getAuthToken(false);

    if (token) {
        // Remove from Chrome's cache
        await new Promise<void>((resolve) => {
            chrome.identity.removeCachedAuthToken({ token }, () => {
                resolve();
            });
        });

        // Revoke from Google
        try {
            await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
        } catch (error) {
            console.error('[Meet Chat Logger] Error revoking token:', error);
        }
    }
}

/**
 * Get user info from Google
 */
export async function getUserInfo(token: string): Promise<{ email: string; name: string } | null> {
    try {
        const response = await fetch(GOOGLE_API.USER_INFO, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        return {
            email: data.email,
            name: data.name,
        };
    } catch (error) {
        console.error('[Meet Chat Logger] Error getting user info:', error);
        return null;
    }
}

/**
 * Find or create a folder in Google Drive
 */
export async function findOrCreateFolder(
    token: string,
    folderName: string
): Promise<string | null> {
    try {
        // Search for existing folder
        const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
        const searchUrl = `${GOOGLE_API.DRIVE_FILES}?q=${encodeURIComponent(query)}`;

        const searchResponse = await fetch(searchUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!searchResponse.ok) {
            throw new Error(`Search failed: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();

        if (searchData.files && searchData.files.length > 0) {
            return searchData.files[0].id;
        }

        // Create new folder
        const createResponse = await fetch(GOOGLE_API.DRIVE_FILES, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
            }),
        });

        if (!createResponse.ok) {
            throw new Error(`Create folder failed: ${createResponse.status}`);
        }

        const createData = await createResponse.json();
        return createData.id;

    } catch (error) {
        console.error('[Meet Chat Logger] Error with folder:', error);
        return null;
    }
}

/**
 * Upload a file to Google Drive
 */
export async function uploadFile(
    token: string,
    filename: string,
    content: string,
    mimeType: string,
    folderId?: string
): Promise<{ success: boolean; fileId?: string; error?: string }> {
    try {
        // Create metadata
        const metadata: Record<string, unknown> = {
            name: filename,
        };

        if (folderId) {
            metadata.parents = [folderId];
        }

        // Create multipart request body
        const boundary = '-------' + Date.now().toString(16);

        const body = [
            `--${boundary}`,
            'Content-Type: application/json; charset=UTF-8',
            '',
            JSON.stringify(metadata),
            `--${boundary}`,
            `Content-Type: ${mimeType}`,
            '',
            content,
            `--${boundary}--`,
        ].join('\r\n');

        const response = await fetch(
            `${GOOGLE_API.DRIVE_UPLOAD}?uploadType=multipart`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': `multipart/related; boundary=${boundary}`,
                },
                body,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message ?? `HTTP ${response.status}`);
        }

        const data = await response.json();

        return {
            success: true,
            fileId: data.id,
        };

    } catch (error) {
        console.error('[Meet Chat Logger] Upload error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
        };
    }
}
