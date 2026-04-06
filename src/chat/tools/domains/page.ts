import { buildCapability } from '../../../capabilities/factory.js';
import { CanonicalCapability } from '../../../capabilities/types.js';
import { graphqlRequest } from '../../../api/graphql.js';
import { parseJsonObject, parseJsonArray } from '../utils/index.js';

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
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'aiGeneratePageFromDescription',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool'],
    execute: async (args) => {
      const input: Record<string, unknown> = {
        owner_id: args.owner_id,
        owner_type: args.owner_type,
        description: args.description,
      };
      if (args.style) input.style = args.style;

      const result = await graphqlRequest<{ aiGeneratePageFromDescription: unknown }>(
        `mutation($input: AiGeneratePageInput!) {
          aiGeneratePageFromDescription(input: $input) {
            _id name status version
            sections { id type order hidden }
            theme { type mode colors { text_primary accent background } }
          }
        }`,
        { input },
      );
      return result.aiGeneratePageFromDescription;
    },
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
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'aiCreatePageConfig',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool'],
    execute: async (args) => {
      const input: Record<string, unknown> = {
        owner_id: args.owner_id,
        owner_type: args.owner_type,
      };
      if (args.name !== undefined) input.name = args.name;
      if (args.template_id !== undefined) input.template_id = args.template_id;
      if (args.theme !== undefined) input.theme = parseJsonObject(args.theme as string, 'theme');
      if (args.sections !== undefined) input.sections = parseJsonArray(args.sections as string, 'sections');

      const result = await graphqlRequest<{ aiCreatePageConfig: unknown }>(
        `mutation($input: AICreatePageConfigInput!) {
          aiCreatePageConfig(input: $input) {
            _id name status version
          }
        }`,
        { input },
      );
      return result.aiCreatePageConfig;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const r = result as Record<string, unknown>;
      return `Page config created: ${r._id} "${r.name || '(unnamed)'}" [${r.status}]`;
    },
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
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'aiUpdatePageConfigSection',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool'],
    execute: async (args) => {
      const parsedUpdates = parseJsonObject(args.updates as string, 'updates');

      const result = await graphqlRequest<{ aiUpdatePageConfigSection: unknown }>(
        `mutation($input: AIUpdatePageConfigSectionInput!, $section_id: String!, $config_id: MongoID!) {
          aiUpdatePageConfigSection(input: $input, section_id: $section_id, config_id: $config_id) {
            _id name status version sections { id type order hidden }
          }
        }`,
        {
          input: { updates: parsedUpdates },
          section_id: args.section_id,
          config_id: args.page_id,
        },
      );
      return result.aiUpdatePageConfigSection;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const r = result as Record<string, unknown>;
      return `Section updated. Page "${r.name || '(unnamed)'}" now at version ${r.version}.`;
    },
  }),
  buildCapability({
    name: 'site_deploy',
    category: 'page',
    displayName: 'site deploy',
    description: 'Publish a page.',
    params: [
      { name: 'page_id', type: 'string', description: 'Page ID', required: true },
    ],
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
    destructive: false,
    backendType: 'query',
    backendResolver: 'aiSuggestSections',
    requiresSpace: false,
    requiresEvent: false,
    surfaces: ['aiTool'],
    execute: async (args) => {
      const variables: Record<string, unknown> = {
        owner_type: args.owner_type,
        owner_id: args.owner_id,
      };
      if (args.context !== undefined) variables.context = args.context;

      const result = await graphqlRequest<{ aiSuggestSections: unknown }>(
        `query($owner_type: String!, $owner_id: MongoID!, $context: String) {
          aiSuggestSections(owner_type: $owner_type, owner_id: $owner_id, context: $context) {
            type name reason default_props
          }
        }`,
        variables,
      );
      return result.aiSuggestSections;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const suggestions = result as Array<Record<string, unknown>>;
      if (!suggestions.length) return 'No section suggestions found.';
      return `${suggestions.length} suggestion(s):\n${suggestions.map(s => `- ${s.type}: ${s.name} — ${s.reason}`).join('\n')}`;
    },
  }),
  buildCapability({
    name: 'page_archive',
    category: 'page',
    displayName: 'page archive',
    description: 'Archive a page configuration.',
    params: [
      { name: 'page_id', type: 'string', description: 'PageConfig ObjectId', required: true },
    ],
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
    destructive: false,
    backendType: 'query',
    backendResolver: 'getSectionCatalog',
    requiresSpace: false,
    requiresEvent: false,
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
    description: 'Generate a preview link for a draft page configuration.',
    params: [
      { name: 'config_id', type: 'string', description: 'Page config ID', required: true },
      { name: 'password', type: 'string', description: 'Optional password protection', required: false },
      { name: 'expires_in_hours', type: 'number', description: 'Link expiry in hours', required: false },
    ],
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'generatePreviewLink',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const variables: Record<string, unknown> = {
        config_id: args.config_id,
      };
      if (args.password !== undefined || args.expires_in_hours !== undefined) {
        const options: Record<string, unknown> = {};
        if (args.password !== undefined) options.password = args.password;
        if (args.expires_in_hours !== undefined) {
          const hours = Number(args.expires_in_hours);
          if (isNaN(hours)) throw new Error('expires_in_hours must be a valid number');
          options.expires_in_hours = hours;
        }
        variables.options = options;
      }

      const result = await graphqlRequest<{ generatePreviewLink: unknown }>(
        `mutation($config_id: MongoID!, $options: PreviewLinkOptionsInput) {
          generatePreviewLink(config_id: $config_id, options: $options) {
            id token url expires_at
          }
        }`,
        variables,
      );
      return result.generatePreviewLink;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const r = result as { url: string; expires_at?: string };
      return r.expires_at ? `Preview: ${r.url} (expires ${r.expires_at})` : `Preview: ${r.url}`;
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
