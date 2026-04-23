import { buildCapability } from '../../../capabilities/factory.js';
import { CanonicalCapability } from '../../../capabilities/types.js';
import { graphqlRequest } from '../../../api/graphql.js';
import { parseJsonObject, parseJsonArray } from '../utils/index.js';

const DISABLED_SITE_AI_MESSAGE =
  'AI page generation tools are temporarily unavailable because the live backend no longer exposes those AI page endpoints.';

function siteAiUnavailable(): never {
  throw new Error(DISABLED_SITE_AI_MESSAGE);
}

export const pageTools: CanonicalCapability[] = [
  buildCapability({
    name: 'site_generate',
    category: 'page',
    displayName: 'site generate',
    description: 'AI-generate a page from a text description.',
    params: [
      { name: 'owner_id', type: 'string', description: 'Owner ID (event or space)', required: true },
      { name: 'owner_type', type: 'string', description: 'Owner type: event|space', required: true,
        enum: ['event', 'space'] },
      { name: 'description', type: 'string', description: 'Page description', required: true },
      { name: 'style', type: 'string', description: 'Style hints', required: false },
    ],
    whenToUse: 'to auto-generate a landing page from a text description using AI',
    searchHint: 'generate page ai website landing build auto',
    alwaysLoad: true,
    destructive: false,
    backendType: 'none',
    backendResolver: 'aiGeneratePageFromDescription',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async () => siteAiUnavailable(),
  }),
  buildCapability({
    name: 'site_create_page',
    category: 'page',
    displayName: 'site create-page',
    description: 'Create a page configuration using AI assistance. For manual control over sections and theme, use page_config_create.',
    params: [
      { name: 'owner_id', type: 'string', description: 'Event or space ID', required: true },
      { name: 'owner_type', type: 'string', description: 'Owner type', required: true,
        enum: ['event', 'space'] },
      { name: 'name', type: 'string', description: 'Page name', required: false },
      { name: 'theme', type: 'string', description: 'Theme config as JSON', required: false },
      { name: 'sections', type: 'string', description: 'Sections as JSON array', required: false },
      { name: 'template_id', type: 'string', description: 'Template ID to base config on', required: false },
    ],
    whenToUse: 'to scaffold a new page with AI-suggested sections and theme',
    searchHint: 'create page website scaffold ai sections',
    alwaysLoad: true,
    destructive: false,
    backendType: 'none',
    backendResolver: 'aiCreatePageConfig',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async () => siteAiUnavailable(),
    formatResult: () => DISABLED_SITE_AI_MESSAGE,
  }),
  buildCapability({
    name: 'site_update_section',
    category: 'page',
    displayName: 'site update-section',
    description: 'Update a section in a page configuration.',
    params: [
      { name: 'page_id', type: 'string', description: 'Page config ID', required: true },
      { name: 'section_id', type: 'string', description: 'Section ID', required: true },
      { name: 'updates', type: 'string', description: 'Section updates as JSON object', required: true },
    ],
    whenToUse: 'when user wants to modify a page section',
    searchHint: 'update edit section page website content',
    destructive: true,
    backendType: 'none',
    backendResolver: 'aiUpdatePageConfigSection',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async () => siteAiUnavailable(),
    formatResult: () => DISABLED_SITE_AI_MESSAGE,
  }),
  buildCapability({
    name: 'site_deploy',
    category: 'page',
    displayName: 'site deploy',
    description: 'Publish a page.',
    params: [
      { name: 'page_id', type: 'string', description: 'Page ID', required: true },
    ],
    whenToUse: 'when user wants to publish a page live',
    searchHint: 'deploy publish page live website launch',
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'publishPageConfig',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ publishPageConfig: unknown }>(
        `mutation($id: MongoID!) {
          publishPageConfig(id: $id) { _id status published_version }
        }`,
        { id: args.page_id },
      );
      return result.publishPageConfig;
    },
  }),
  buildCapability({
    name: 'site_templates',
    category: 'page',
    displayName: 'site templates',
    description: 'List available page section templates with AI suggestions.',
    params: [
      { name: 'owner_type', type: 'string', description: 'Owner type', required: true,
        enum: ['event', 'space'] },
      { name: 'owner_id', type: 'string', description: 'Event or space ID', required: true },
      { name: 'context', type: 'string', description: 'Context for AI suggestions', required: false },
    ],
    whenToUse: 'when user wants AI section suggestions for a page',
    searchHint: 'templates suggestions sections page components',
    destructive: false,
    backendType: 'none',
    backendResolver: 'aiSuggestSections',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool'],
    execute: async () => siteAiUnavailable(),
    formatResult: () => DISABLED_SITE_AI_MESSAGE,
  }),
  buildCapability({
    name: 'page_archive',
    category: 'page',
    displayName: 'page archive',
    description: 'Archive a page configuration.',
    params: [
      { name: 'page_id', type: 'string', description: 'PageConfig ObjectId', required: true },
    ],
    whenToUse: 'when user wants to archive a page',
    searchHint: 'archive hide page disable remove',
    shouldDefer: true,
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'archivePageConfig',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ archivePageConfig: unknown }>(
        `mutation($id: MongoID!) {
          archivePageConfig(id: $id) { _id name status }
        }`,
        { id: args.page_id },
      );
      return result.archivePageConfig;
    },
  }),
  buildCapability({
    name: 'page_save_version',
    category: 'page',
    displayName: 'page save version',
    description: 'Save a named version snapshot of a page configuration.',
    params: [
      { name: 'config_id', type: 'string', description: 'PageConfig ObjectId', required: true },
      { name: 'name', type: 'string', description: 'Version name', required: false },
    ],
    whenToUse: 'when user wants to save a page version snapshot',
    searchHint: 'save version snapshot page backup',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'saveConfigVersion',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const vars: Record<string, unknown> = { config_id: args.config_id };
      if (args.name) vars.name = args.name;

      const result = await graphqlRequest<{ saveConfigVersion: unknown }>(
        `mutation($config_id: MongoID!, $name: String) {
          saveConfigVersion(config_id: $config_id, name: $name) {
            _id config_id version name
          }
        }`,
        vars,
      );
      return result.saveConfigVersion;
    },
  }),
  buildCapability({
    name: 'page_restore_version',
    category: 'page',
    displayName: 'page restore version',
    description: 'Restore a page configuration to a previous version.',
    params: [
      { name: 'config_id', type: 'string', description: 'PageConfig ObjectId', required: true },
      { name: 'version', type: 'number', description: 'Version number to restore', required: true },
    ],
    whenToUse: 'when user wants to restore a previous page version',
    searchHint: 'restore rollback revert page version undo',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'restoreConfigVersion',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ restoreConfigVersion: unknown }>(
        `mutation($config_id: MongoID!, $version: Float!) {
          restoreConfigVersion(config_id: $config_id, version: $version) {
            _id name status version
          }
        }`,
        { config_id: args.config_id, version: args.version },
      );
      return result.restoreConfigVersion;
    },
  }),
  buildCapability({
    name: 'page_list_versions',
    category: 'page',
    displayName: 'page list versions',
    description: 'List saved versions of a page configuration.',
    params: [
      { name: 'config_id', type: 'string', description: 'PageConfig ObjectId', required: true },
    ],
    whenToUse: 'when user wants to see page version history',
    searchHint: 'list versions history page snapshots',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'listConfigVersions',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ listConfigVersions: unknown }>(
        `query($config_id: MongoID!) {
          listConfigVersions(config_id: $config_id) {
            _id config_id version name
          }
        }`,
        { config_id: args.config_id },
      );
      return result.listConfigVersions;
    },
  }),
  buildCapability({
    name: 'page_section_catalog',
    category: 'page',
    displayName: 'page section catalog',
    description: 'Get the catalog of available section types for page building.',
    params: [],
    whenToUse: 'when user wants to see available section types',
    searchHint: 'section catalog types available components blocks',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getSectionCatalog',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool', 'cliCommand'],
    execute: async () => {
      const result = await graphqlRequest<{ getSectionCatalog: unknown }>(
        `query {
          getSectionCatalog { type name description category supports_children }
        }`,
      );
      return result.getSectionCatalog;
    },
  }),
  buildCapability({
    name: 'page_config_get',
    category: 'page',
    displayName: 'page config get',
    description: 'Get a page configuration by ID.',
    params: [
      { name: 'config_id', type: 'string', description: 'Page config ID', required: true },
    ],
    whenToUse: 'when user wants to view a page configuration',
    searchHint: 'get view page config settings details',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getPageConfig',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getPageConfig: unknown }>(
        `query($id: MongoID!) {
          getPageConfig(id: $id) {
            _id owner_type owner_id name description status version published_version template_id thumbnail_url
            sections { id type order hidden props }
          }
        }`,
        { id: args.config_id },
      );
      return result.getPageConfig;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const r = result as Record<string, unknown>;
      const sections = r.sections as Array<Record<string, unknown>> | undefined;
      const lines = [`Page "${r.name || '(unnamed)'}" [${r.status}] v${r.version}`];
      lines.push(`Owner: ${r.owner_type} ${r.owner_id}`);
      if (sections?.length) lines.push(`Sections: ${sections.length} (${sections.map((s: Record<string, unknown>) => s.type).join(', ')})`);
      if (r.template_id) lines.push(`Template: ${r.template_id}`);
      return lines.join('\n');
    },
  }),
  buildCapability({
    name: 'page_config_update',
    category: 'page',
    displayName: 'page config update',
    description: 'Update a page configuration (name, description, theme, sections).',
    params: [
      { name: 'config_id', type: 'string', description: 'Page config ID', required: true },
      { name: 'name', type: 'string', description: 'Page name', required: false },
      { name: 'description', type: 'string', description: 'Page description', required: false },
      { name: 'theme', type: 'string', description: 'Theme config as JSON', required: false },
      { name: 'sections', type: 'string', description: 'Sections as JSON array', required: false },
    ],
    whenToUse: 'when user wants to update page name or theme',
    searchHint: 'update edit page config theme settings',
    shouldDefer: true,
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'updatePageConfig',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {};
      if (args.name !== undefined) input.name = args.name;
      if (args.description !== undefined) input.description = args.description;
      if (args.theme !== undefined) input.theme = parseJsonObject(args.theme as string, 'theme');
      if (args.sections !== undefined) input.sections = parseJsonArray(args.sections as string, 'sections');

      if (Object.keys(input).length === 0) throw new Error('At least one field to update is required (name, description, theme, or sections)');

      const result = await graphqlRequest<{ updatePageConfig: unknown }>(
        `mutation($input: UpdatePageConfigInput!, $id: MongoID!) {
          updatePageConfig(input: $input, id: $id) {
            _id name status version
          }
        }`,
        { input, id: args.config_id },
      );
      return result.updatePageConfig;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const r = result as Record<string, unknown>;
      return `Page "${r.name || '(unnamed)'}" updated [${r.status}] v${r.version}`;
    },
  }),
  buildCapability({
    name: 'page_config_published',
    category: 'page',
    displayName: 'page config published',
    description: 'Get the currently published page configuration for an event or space.',
    params: [
      { name: 'owner_type', type: 'string', description: 'Owner type', required: true,
        enum: ['event', 'space'] },
      { name: 'owner_id', type: 'string', description: 'Event or space ID', required: true },
    ],
    whenToUse: 'when user wants to see the live published page',
    searchHint: 'published live page current active config',
    shouldDefer: true,
    destructive: false,
    backendType: 'query',
    backendResolver: 'getPublishedConfig',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getPublishedConfig: unknown }>(
        `query($owner_type: String!, $owner_id: MongoID!) {
          getPublishedConfig(owner_type: $owner_type, owner_id: $owner_id) {
            _id owner_type owner_id name status version
            sections { id type order hidden }
          }
        }`,
        { owner_type: args.owner_type, owner_id: args.owner_id },
      );
      return result.getPublishedConfig;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const r = result as Record<string, unknown>;
      const sections = r.sections as Array<Record<string, unknown>> | undefined;
      const lines = [`Page "${r.name || '(unnamed)'}" [${r.status}] v${r.version}`];
      lines.push(`Owner: ${r.owner_type} ${r.owner_id}`);
      if (sections?.length) lines.push(`Sections: ${sections.length} (${sections.map((s: Record<string, unknown>) => s.type).join(', ')})`);
      return lines.join('\n');
    },
  }),
  buildCapability({
    name: 'page_preview_link',
    category: 'page',
    displayName: 'page preview link',
    description: 'Create a preview link for a draft event or space page. Returns a token; the full URL is constructed client-side.',
    params: [
      { name: 'link_type', type: 'string', description: 'Resource type: event or space', required: true,
        enum: ['event', 'space'] },
      { name: 'resource_id', type: 'string', description: 'Event or space ID', required: true },
      { name: 'password', type: 'string', description: 'Optional password protection', required: false },
      { name: 'expires_in_hours', type: 'number', description: 'Link expiry in hours (converted to absolute expires_at)', required: false },
    ],
    whenToUse: 'when user wants a preview link for a draft event or space page',
    searchHint: 'preview link draft page share test event space',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'createPreviewLink',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        link_type: args.link_type,
        resource_id: args.resource_id,
      };
      if (args.password !== undefined) input.password = args.password;
      if (args.expires_in_hours !== undefined) {
        const hours = Number(args.expires_in_hours);
        if (isNaN(hours)) throw new Error('expires_in_hours must be a valid number');
        input.expires_at = new Date(Date.now() + hours * 3600_000).toISOString();
      }

      const result = await graphqlRequest<{ createPreviewLink: unknown }>(
        `mutation($input: CreatePreviewLinkInput!) {
          createPreviewLink(input: $input) {
            _id token link_type resource_id expires_at
          }
        }`,
        { input },
      );
      return result.createPreviewLink;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const r = result as { _id: string; token: string; link_type: string; resource_id: string; expires_at?: string };
      const lines = [`Preview link created [${r._id}]`];
      lines.push(`Type: ${r.link_type} ${r.resource_id}`);
      lines.push(`Token: ${r.token}`);
      lines.push('(Construct preview URL client-side from token.)');
      if (r.expires_at) lines.push(`Expires: ${r.expires_at}`);
      return lines.join('\n');
    },
  }),
  buildCapability({
    name: 'page_config_create',
    category: 'page',
    displayName: 'page config create',
    description: 'Create a page configuration with full control over sections and theme. For AI-assisted creation, use site_create_page.',
    params: [
      { name: 'owner_type', type: 'string', description: 'Owner type', required: true,
        enum: ['event', 'space'] },
      { name: 'owner_id', type: 'string', description: 'Event or space ID', required: true },
      { name: 'name', type: 'string', description: 'Page name', required: false },
      { name: 'template_id', type: 'string', description: 'Template ID to base config on', required: false },
      { name: 'theme', type: 'string', description: 'Theme config as JSON', required: false },
      { name: 'sections', type: 'string', description: 'Sections as JSON array', required: false },
    ],
    whenToUse: 'when user wants to create a page config manually',
    searchHint: 'create page config manual sections theme',
    shouldDefer: true,
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'createPageConfig',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool'],
    execute: async (args) => {
      const input: Record<string, unknown> = {
        owner_type: args.owner_type,
        owner_id: args.owner_id,
      };
      if (args.name !== undefined) input.name = args.name;
      if (args.template_id !== undefined) input.template_id = args.template_id;
      if (args.theme !== undefined) input.theme = parseJsonObject(args.theme as string, 'theme');
      if (args.sections !== undefined) input.sections = parseJsonArray(args.sections as string, 'sections');

      const result = await graphqlRequest<{ createPageConfig: unknown }>(
        `mutation($input: CreatePageConfigInput!) {
          createPageConfig(input: $input) {
            _id owner_type owner_id name status version
          }
        }`,
        { input },
      );
      return result.createPageConfig;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const r = result as Record<string, unknown>;
      return `Page config created: ${r._id} "${r.name || '(unnamed)'}" [${r.status}]`;
    },
  }),
];
