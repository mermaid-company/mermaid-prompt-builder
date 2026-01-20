/**
 * Google Drive Service
 *
 * Interact with Google Drive for file operations.
 */

import { getDriveClient } from "./auth";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("google-drive");

// IARA-ADMIN shared drive ID
const SHARED_DRIVE_ID = process.env.GOOGLE_SHARED_DRIVE_ID;

/**
 * Find or create a folder in the shared drive
 */
export async function findOrCreateFolder(
  folderName: string,
  parentId?: string
): Promise<string> {
  const drive = getDriveClient();

  // Search for existing folder
  const query = parentId
    ? `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const searchParams: {
    q: string;
    fields: string;
    supportsAllDrives: boolean;
    includeItemsFromAllDrives: boolean;
    driveId?: string;
    corpora?: string;
  } = {
    q: query,
    fields: "files(id, name)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  };

  if (SHARED_DRIVE_ID) {
    searchParams.driveId = SHARED_DRIVE_ID;
    searchParams.corpora = "drive";
  }

  const response = await drive.files.list(searchParams);

  if (response.data.files && response.data.files.length > 0) {
    logger.info(`Found existing folder: ${folderName}`);
    return response.data.files[0].id!;
  }

  // Create new folder
  const folderMetadata: {
    name: string;
    mimeType: string;
    parents?: string[];
  } = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };

  if (parentId) {
    folderMetadata.parents = [parentId];
  } else if (SHARED_DRIVE_ID) {
    folderMetadata.parents = [SHARED_DRIVE_ID];
  }

  const createResponse = await drive.files.create({
    requestBody: folderMetadata,
    fields: "id",
    supportsAllDrives: true,
  });

  logger.info(`Created folder: ${folderName}`, { id: createResponse.data.id });
  return createResponse.data.id!;
}

/**
 * List files in a folder
 */
export async function listFilesInFolder(folderId: string): Promise<
  Array<{
    id: string;
    name: string;
    mimeType: string;
  }>
> {
  const drive = getDriveClient();

  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id, name, mimeType)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return (response.data.files || []).map((file) => ({
    id: file.id!,
    name: file.name!,
    mimeType: file.mimeType!,
  }));
}

/**
 * Get shared drive ID from name
 */
export async function getSharedDriveId(
  driveName: string
): Promise<string | null> {
  const drive = getDriveClient();

  const response = await drive.drives.list({
    q: `name='${driveName}'`,
    fields: "drives(id, name)",
  });

  if (response.data.drives && response.data.drives.length > 0) {
    return response.data.drives[0].id!;
  }

  return null;
}
