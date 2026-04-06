import { ToolDef } from '../../providers/interface.js';
import { graphqlRequest } from '../../../api/graphql.js';

export const userTools: ToolDef[] = [
  {
    name: 'get_me',
    category: 'user',
    displayName: 'auth whoami',
    description: 'Get the current authenticated user profile.',
    params: [],
    destructive: false,
    execute: async () => {
      const result = await graphqlRequest<{ aiGetMe: { user: unknown } }>(
        'query { aiGetMe { user { _id name email first_name last_name } } }',
      );
      return result.aiGetMe.user;
    },
    formatResult: (result) => {
      const r = result as { _id: string; name: string; email: string };
      return `Logged in as ${r.name} (${r.email})`;
    },
  },
  {
    name: 'user_update',
    category: 'user',
    displayName: 'user update',
    description: 'Update your profile (name, display name, bio, tagline, timezone, username, social handles).',
    params: [
      { name: 'name', type: 'string', description: 'Full name', required: false },
      { name: 'display_name', type: 'string', description: 'Display name', required: false },
      { name: 'description', type: 'string', description: 'Bio/description', required: false },
      { name: 'tagline', type: 'string', description: 'Short tagline', required: false },
      { name: 'timezone', type: 'string', description: 'Timezone (e.g., America/New_York)', required: false },
      { name: 'username', type: 'string', description: 'Username', required: false },
      { name: 'job_title', type: 'string', description: 'Job title', required: false },
      { name: 'company_name', type: 'string', description: 'Company name', required: false },
      { name: 'website', type: 'string', description: 'Website URL', required: false },
      { name: 'handle_twitter', type: 'string', description: 'Twitter/X handle', required: false },
      { name: 'handle_instagram', type: 'string', description: 'Instagram handle', required: false },
      { name: 'handle_linkedin', type: 'string', description: 'LinkedIn handle', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(args)) {
        if (value !== undefined && value !== null) input[key] = value;
      }
      const result = await graphqlRequest<{ updateUser: unknown }>(
        `mutation($input: UserInput!) {
          updateUser(input: $input) {
            _id name display_name description tagline timezone username job_title company_name website
          }
        }`,
        { input },
      );
      return result.updateUser;
    },
    formatResult: (result) => {
      const r = result as { name?: string; display_name?: string; username?: string };
      return `Profile updated: ${r.display_name || r.name || 'user'}${r.username ? ` (@${r.username})` : ''}.`;
    },
  },
  {
    name: 'user_search',
    category: 'user',
    displayName: 'user search',
    description: 'Search users by name or email.',
    params: [
      { name: 'query', type: 'string', description: 'Search query (name or email)', required: true },
    ],
    destructive: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ searchUsers: Array<{ _id: string; name?: string; email?: string; username?: string; display_name?: string; verified?: boolean }> }>(
        `query($query: String!) {
          searchUsers(query: $query) {
            _id name email username display_name verified
          }
        }`,
        { query: args.query },
      );
      return { users: result.searchUsers, count: result.searchUsers.length };
    },
  },
];
