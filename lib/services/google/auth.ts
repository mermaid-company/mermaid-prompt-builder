/**
 * Google Auth Service
 *
 * Authentication using service account credentials.
 */

import { google, Auth } from "googleapis";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("google-auth");

// Auth client cache
let authClient: Auth.GoogleAuth | null = null;

/**
 * Get Google Auth client using service account credentials
 */
export function getGoogleAuth(): Auth.GoogleAuth {
  if (authClient) {
    return authClient;
  }

  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_JSON;

  if (!credentialsJson) {
    throw new Error(
      "Google service account credentials not found. Set GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_JSON."
    );
  }

  try {
    const credentials = JSON.parse(credentialsJson);

    authClient = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
      ],
    });

    logger.info("Google Auth client created");
    return authClient;
  } catch (error) {
    logger.error("Failed to parse Google credentials", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error("Invalid Google service account credentials JSON");
  }
}

/**
 * Get Google Drive client
 */
export function getDriveClient() {
  const auth = getGoogleAuth();
  return google.drive({ version: "v3", auth });
}

/**
 * Get Google Sheets client
 */
export function getSheetsClient() {
  const auth = getGoogleAuth();
  return google.sheets({ version: "v4", auth });
}

/**
 * Clear auth cache (for testing)
 */
export function clearAuthCache(): void {
  authClient = null;
  logger.info("Google auth cache cleared");
}
