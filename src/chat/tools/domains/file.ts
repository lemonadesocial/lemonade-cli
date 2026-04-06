import { buildCapability } from '../../../capabilities/factory.js';
import { CanonicalCapability } from '../../../capabilities/types.js';
import { graphqlRequest } from '../../../api/graphql.js';
import { uploadLocalFile } from '../utils/index.js';

export const fileTools: CanonicalCapability[] = [
  buildCapability({
    name: 'file_upload',
    category: 'file',
    displayName: 'file upload',
    description:
      'Upload an image file from a local path. Returns the file ID for use with space/event image fields. Recommended dimensions: 800x800 pixels for event covers and space avatars.',
    params: [
      {
        name: 'file_path',
        type: 'string',
        description: 'Local file path to upload (supports: png, jpg, jpeg, gif, svg, webp)',
        required: true,
      },
      {
        name: 'directory',
        type: 'string',
        description: 'Upload directory context',
        required: false,
        enum: ['event', 'user', 'space'],
      },
      { name: 'description', type: 'string', description: 'File description', required: false },
    ],
    whenToUse: 'when user wants to upload a local image file',
    searchHint: 'upload file image photo local path',
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'createFile',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const filePath = args.file_path as string;
      const directory = (args.directory as string) || 'event';
      const description = args.description as string | undefined;
      return uploadLocalFile(filePath, directory, description);
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const r = result as { _id: string; url: string };
      return `File uploaded — ID: ${r._id}\nURL: ${r.url}\nUse this file ID with space_set_avatar, space_set_cover (image_avatar/image_cover) or event_set_photos (new_new_photos).`;
    },
  }),
  buildCapability({
    name: 'file_upload_url',
    category: 'file',
    displayName: 'file upload url',
    description:
      'Upload an image from a URL (the server downloads it). Returns the file ID. Recommended: 800x800 pixels for event covers and space avatars.',
    params: [
      { name: 'url', type: 'string', description: 'URL of the image to upload', required: true },
      { name: 'description', type: 'string', description: 'File description', required: false },
    ],
    whenToUse: 'when user wants to upload an image from a URL',
    searchHint: 'upload image url remote download file',
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'createFile',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const url = args.url as string;
      // M2: URL validation
      if (!url.startsWith('https://') && !url.startsWith('http://')) {
        throw new Error('URL must start with https:// or http://');
      }

      // L1: Only pass input variable if description is defined
      const variables: Record<string, unknown> = { url };
      if (args.description !== undefined) variables.input = { description: args.description };

      const result = await graphqlRequest<{
        createFile: { _id: string; url: string; type: string; size: number };
      }>(
        `mutation($url: String!, $input: FileInput) {
          createFile(url: $url, input: $input) {
            _id url type size
          }
        }`,
        variables,
      );
      return result.createFile;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const r = result as { _id: string; url: string };
      return `File uploaded from URL — ID: ${r._id}\nURL: ${r.url}\nUse this file ID with space_set_avatar, space_set_cover (image_avatar/image_cover) or event_set_photos (new_new_photos).`;
    },
  }),
];
