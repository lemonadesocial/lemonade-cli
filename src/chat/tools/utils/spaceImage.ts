import { graphqlRequest } from '../../../api/graphql.js';
import { uploadLocalFile } from './fileUpload.js';

// L2: Shared helper for space image updates
export const SPACE_IMAGE_QUERIES: Record<'image_avatar' | 'image_cover', string> = {
  image_avatar: `mutation($input: SpaceInput!, $_id: MongoID!) {
    updateSpace(input: $input, _id: $_id) {
      _id title image_avatar
    }
  }`,
  image_cover: `mutation($input: SpaceInput!, $_id: MongoID!) {
    updateSpace(input: $input, _id: $_id) {
      _id title image_cover
    }
  }`,
};

export async function setSpaceImage(spaceId: string, field: 'image_avatar' | 'image_cover', fileId?: string, filePath?: string): Promise<unknown> {
  if (!fileId && !filePath) throw new Error('Provide either file_id or file_path.');
  if (fileId && filePath) throw new Error('Provide either file_id or file_path, not both.');

  let id = fileId;
  if (filePath) {
    const uploaded = await uploadLocalFile(filePath, 'space');
    id = uploaded._id;
  }

  const result = await graphqlRequest<Record<string, unknown>>(
    SPACE_IMAGE_QUERIES[field],
    { input: { [field]: id }, _id: spaceId },
  );
  return result.updateSpace;
}
