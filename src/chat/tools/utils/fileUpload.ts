import { existsSync, statSync, readFileSync, realpathSync, openSync, readSync, closeSync } from 'fs';
import { extname, resolve } from 'path';
import { graphqlRequest } from '../../../api/graphql.js';

export const MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};

export const VALID_EXTENSIONS = Object.keys(MIME_TYPES);

export const MAGIC_BYTES: Record<string, number[][]> = {
  png: [[0x89, 0x50, 0x4E, 0x47]],
  jpg: [[0xFF, 0xD8, 0xFF]],
  jpeg: [[0xFF, 0xD8, 0xFF]],
  gif: [[0x47, 0x49, 0x46]],
  // WebP is validated separately (RIFF header + WEBP signature)
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function uploadLocalFile(
  filePath: string,
  directory: string,
  description?: string,
): Promise<{ _id: string; url: string }> {
  const resolvedPath = resolve(filePath);

  // H1: File existence check (before realpath so we get a clear error)
  if (!existsSync(resolvedPath)) throw new Error(`File not found: ${resolvedPath}`);

  // Resolve symlinks so that symlinks pointing to sensitive paths are caught
  const realPath = realpathSync(resolvedPath);

  // H4: Block sensitive directories
  const blockedPrefixes = ['/etc/', '/var/', '/proc/', '/sys/'];
  const homeDir = process.env.HOME || '';
  const blockedHomePaths = ['.ssh', '.gnupg', '.aws', '.config', '.kube', '.docker'];
  for (const prefix of blockedPrefixes) {
    if (realPath.startsWith(prefix)) throw new Error(`Cannot upload files from ${prefix}`);
  }
  for (const sensitive of blockedHomePaths) {
    if (homeDir && realPath.startsWith(`${homeDir}/${sensitive}`)) {
      throw new Error(`Cannot upload files from ~/${sensitive}`);
    }
  }

  // H1/H2: Size and emptiness checks
  const stats = statSync(realPath);
  if (stats.size > MAX_FILE_SIZE) throw new Error(`File too large: ${(stats.size / 1024 / 1024).toFixed(1)}MB (max 50MB)`);
  if (stats.size === 0) throw new Error('File is empty');

  const ext = extname(realPath).slice(1).toLowerCase();
  if (!VALID_EXTENSIONS.includes(ext)) {
    throw new Error(`Unsupported file type: .${ext}. Supported: ${VALID_EXTENSIONS.join(', ')}`);
  }
  const mimeType = MIME_TYPES[ext];

  // M1: Magic byte validation — read only the header first (12 bytes for WebP RIFF+WEBP check)
  if (ext !== 'svg') {
    const fd = openSync(realPath, 'r');
    const header = Buffer.alloc(12);
    readSync(fd, header, 0, 12, 0);
    closeSync(fd);

    // Special handling for WebP: check RIFF header (bytes 0-3) AND WEBP signature (bytes 8-11)
    if (ext === 'webp') {
      const riff = [0x52, 0x49, 0x46, 0x46];
      const webp = [0x57, 0x45, 0x42, 0x50];
      const isRiff = riff.every((byte, i) => header[i] === byte);
      const isWebp = webp.every((byte, i) => header[i + 8] === byte);
      if (!isRiff || !isWebp) throw new Error('File content does not match webp format — file may be misnamed');
    } else {
      const expected = MAGIC_BYTES[ext];
      if (expected) {
        const matches = expected.some(magic => magic.every((byte, i) => header[i] === byte));
        if (!matches) throw new Error(`File content does not match ${ext} format — file may be misnamed`);
      }
    }
  }

  // Only after validation passes, read the full file
  const fileBuffer = readFileSync(realPath);

  const uploadInfo: Record<string, unknown> = { extension: ext };
  if (description) uploadInfo.description = description;

  const createResult = await graphqlRequest<{
    createFileUploads: Array<{ _id: string; url: string; presigned_url: string; type: string; key: string }>;
  }>(
    `mutation($upload_infos: [FileUploadInfo!]!, $directory: String!) {
      createFileUploads(upload_infos: $upload_infos, directory: $directory) {
        _id url presigned_url type key
      }
    }`,
    { upload_infos: [uploadInfo], directory },
  );

  const fileRecord = createResult.createFileUploads[0];
  if (!fileRecord) throw new Error('No file record returned from createFileUploads');

  // L4: Abort after 60 seconds
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  let response: Response;
  try {
    response = await fetch(fileRecord.presigned_url, {
      method: 'PUT',
      headers: { 'Content-Type': mimeType },
      body: fileBuffer,
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (e) {
    clearTimeout(timeout);
    if ((e as Error).name === 'AbortError') throw new Error('S3 upload timed out after 60 seconds');
    throw e;
  }
  // H3: Inform user that a record was created if S3 PUT fails
  if (!response.ok) {
    throw new Error(`S3 upload failed (${response.status}). A file record was created but not confirmed — retry with a new upload.`);
  }

  await graphqlRequest<{ confirmFileUploads: boolean }>(
    `mutation($ids: [MongoID!]!) {
      confirmFileUploads(ids: $ids)
    }`,
    { ids: [fileRecord._id] },
  );

  return { _id: fileRecord._id, url: fileRecord.url };
}
