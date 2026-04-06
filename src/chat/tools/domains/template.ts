import { buildCapability } from '../../../capabilities/factory.js';
import { CanonicalCapability } from '../../../capabilities/types.js';
import { graphqlRequest } from '../../../api/graphql.js';

export const templateTools: CanonicalCapability[] = [
  buildCapability({
    name: 'template_list',
    category: 'template',
    displayName: 'template list',
    description: 'List available page templates with optional filters.',
    params: [
      { name: 'category', type: 'string', description: 'Filter by category', required: false },
      { name: 'target', type: 'string', description: 'Filter by target (event, space, universal)', required: false },
      { name: 'search', type: 'string', description: 'Search text', required: false },
      { name: 'featured', type: 'boolean', description: 'Filter featured only', required: false },
      { name: 'tier_max', type: 'string', description: 'Max subscription tier', required: false },
      { name: 'creator_id', type: 'string', description: 'Filter by creator', required: false },
      { name: 'limit', type: 'number', description: 'Pagination limit', required: false },
      { name: 'skip', type: 'number', description: 'Pagination offset', required: false },
    ],
    whenToUse: 'when user wants to browse page templates',
    searchHint: 'templates browse list page designs layouts',
    destructive: false,
    backendType: 'query',
    backendResolver: 'listTemplates',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const vars: Record<string, unknown> = {};
      if (args.category) vars.category = args.category;
      if (args.target) vars.target = args.target;
      if (args.search) vars.search = args.search;
      if (args.featured !== undefined) vars.featured = args.featured;
      if (args.tier_max) vars.tier_max = args.tier_max;
      if (args.creator_id) vars.creator_id = args.creator_id;
      if (args.limit !== undefined) vars.limit = args.limit;
      if (args.skip !== undefined) vars.skip = args.skip;

      const result = await graphqlRequest<{ listTemplates: unknown }>(
        `query($category: String, $target: String, $search: String, $featured: Boolean, $tier_max: String, $creator_id: MongoID, $limit: Int, $skip: Int) {
          listTemplates(category: $category, target: $target, search: $search, featured: $featured, tier_max: $tier_max, creator_id: $creator_id, limit: $limit, skip: $skip) {
            _id name slug description category tags thumbnail_url target visibility
          }
        }`,
        vars,
      );
      return result.listTemplates;
    },
  }),
  buildCapability({
    name: 'template_clone_to_config',
    category: 'template',
    displayName: 'template clone to config',
    description: 'Clone a template to create a new page configuration for an event or space.',
    params: [
      { name: 'template_id', type: 'string', description: 'Template ObjectId', required: true },
      { name: 'owner_type', type: 'string', description: 'Owner type', required: true,
        enum: ['event', 'space'] },
      { name: 'owner_id', type: 'string', description: 'Event or space ObjectId', required: true },
    ],
    whenToUse: 'when user wants to use a template for their page',
    searchHint: 'clone template apply use page config',
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'cloneTemplateToConfig',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ cloneTemplateToConfig: unknown }>(
        `mutation($template_id: MongoID!, $owner_type: String!, $owner_id: MongoID!) {
          cloneTemplateToConfig(template_id: $template_id, owner_type: $owner_type, owner_id: $owner_id) {
            _id name status version
          }
        }`,
        { template_id: args.template_id, owner_type: args.owner_type, owner_id: args.owner_id },
      );
      return result.cloneTemplateToConfig;
    },
  }),
];
