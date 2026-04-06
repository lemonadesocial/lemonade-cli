import { buildCapability } from '../../../capabilities/factory.js';
import { CanonicalCapability } from '../../../capabilities/types.js';
import { graphqlRequest } from '../../../api/graphql.js';

export const newsletterTools: CanonicalCapability[] = [
  buildCapability({
    name: 'newsletter_list',
    category: 'newsletter',
    displayName: 'newsletter list',
    description: 'List newsletters for a space (drafts, scheduled, or sent).',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'draft', type: 'boolean', description: 'Show only drafts', required: false },
      { name: 'sent', type: 'boolean', description: 'Show only sent', required: false },
      { name: 'scheduled', type: 'boolean', description: 'Show only scheduled', required: false },
    ],
    whenToUse: 'when user wants to see space newsletters',
    searchHint: 'newsletter list emails campaigns drafts sent',
    destructive: false,
    backendType: 'query',
    backendResolver: 'listSpaceNewsletters',
    requiresEvent: false,
    execute: async (args) => {
      const variables: Record<string, unknown> = { space: args.space_id };
      if (args.draft !== undefined) variables.draft = args.draft;
      if (args.sent !== undefined) variables.sent = args.sent;
      if (args.scheduled !== undefined) variables.scheduled = args.scheduled;
      const result = await graphqlRequest<{ listSpaceNewsletters: unknown }>(
        `query($space: MongoID!, $draft: Boolean, $sent: Boolean, $scheduled: Boolean) {
          listSpaceNewsletters(space: $space, draft: $draft, sent: $sent, scheduled: $scheduled) {
            _id subject_preview draft disabled
            scheduled_at sent_at failed_at created_at
            recipient_types
          }
        }`,
        variables,
      );
      return result.listSpaceNewsletters;
    },
    formatResult: (result) => {
      const items = result as Array<{ _id: string; subject_preview: string; draft: boolean; disabled: boolean; sent_at: string | null; scheduled_at: string | null; failed_at: string | null; created_at: string }>;
      if (!Array.isArray(items)) return JSON.stringify(result);
      const lines = items.map((n) => {
        const status = n.disabled ? 'disabled' : n.failed_at ? 'failed' : n.sent_at ? 'sent' : n.scheduled_at ? 'scheduled' : 'draft';
        const date = n.sent_at || n.failed_at || n.scheduled_at || n.created_at || '';
        return `- [${n._id}] ${n.subject_preview || '(no subject)'} [${status}] ${date}`;
      });
      return `${items.length} newsletter(s):\n${lines.join('\n')}`;
    },
  }),
  buildCapability({
    name: 'newsletter_get',
    category: 'newsletter',
    displayName: 'newsletter get',
    description: 'Get details of a specific newsletter.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'newsletter_id', type: 'string', description: 'Newsletter ID', required: true },
    ],
    whenToUse: 'when user wants details of a specific newsletter',
    searchHint: 'newsletter details get view specific',
    destructive: false,
    backendType: 'query',
    backendResolver: 'getSpaceNewsletter',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getSpaceNewsletter: unknown }>(
        `query($space: MongoID!, $_id: MongoID!) {
          getSpaceNewsletter(space: $space, _id: $_id) {
            _id custom_subject_html custom_body_html draft disabled
            scheduled_at sent_at failed_at failed_reason
            recipient_types cc created_at
            subject_preview body_preview
          }
        }`,
        { space: args.space_id, _id: args.newsletter_id },
      );
      return result.getSpaceNewsletter;
    },
    formatResult: (result) => {
      const r = result as Record<string, unknown>;
      if (!r || !r._id) return 'Newsletter not found.';
      const status = r.disabled ? 'disabled' : r.failed_at ? 'failed' : r.sent_at ? 'sent' : r.scheduled_at ? 'scheduled' : 'draft';
      const lines = [`Newsletter ${r._id}: "${r.subject_preview || r.custom_subject_html || '(no subject)'}" [${status}]`];
      const bodyPreview = (r.body_preview || r.custom_body_html || '') as string;
      if (bodyPreview) lines.push(`Body: ${bodyPreview.substring(0, 120)}${bodyPreview.length > 120 ? '...' : ''}`);
      if (r.recipient_types && (r.recipient_types as string[]).length) lines.push(`Recipients: ${(r.recipient_types as string[]).join(', ')}`);
      if (r.cc && (r.cc as string[]).length) lines.push(`CC: ${(r.cc as string[]).join(', ')}`);
      if (r.created_at) lines.push(`Created: ${r.created_at}`);
      if (r.scheduled_at) lines.push(`Scheduled: ${r.scheduled_at}`);
      if (r.sent_at) lines.push(`Sent: ${r.sent_at}`);
      if (r.failed_at) lines.push(`Failed: ${r.failed_at} — ${r.failed_reason || 'unknown reason'}`);
      return lines.join('\n');
    },
  }),
  buildCapability({
    name: 'newsletter_create',
    category: 'newsletter',
    displayName: 'newsletter create',
    description: 'Create a newsletter for a space.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'subject', type: 'string', description: 'Email subject (HTML supported)', required: true },
      { name: 'body', type: 'string', description: 'Email body (HTML supported)', required: true },
      { name: 'cc', type: 'string', description: 'CC email addresses (comma-separated)', required: false },
      { name: 'scheduled_at', type: 'string', description: 'Schedule send time (ISO 8601)', required: false },
      { name: 'recipient_types', type: 'string', description: 'Comma-separated recipient types: assigned, attending, registration, invited, space_tagged_people', required: false },
      { name: 'draft', type: 'boolean', description: 'Save as draft (server default applies if omitted)', required: false },
    ],
    whenToUse: 'when user wants to compose a new newsletter',
    searchHint: 'create newsletter email compose campaign',
    destructive: false,
    backendType: 'mutation',
    backendResolver: 'createSpaceNewsletter',
    requiresEvent: false,
    execute: async (args) => {
      const input: Record<string, unknown> = { space: args.space_id };
      input.custom_subject_html = args.subject;
      input.custom_body_html = args.body;
      if (args.cc !== undefined) input.cc = (args.cc as string).split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (args.scheduled_at !== undefined) {
        const d = new Date(args.scheduled_at as string);
        if (isNaN(d.getTime())) throw new Error('Invalid date for scheduled_at');
        input.scheduled_at = d.toISOString();
      }
      if (args.recipient_types !== undefined) input.recipient_types = (args.recipient_types as string).split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (args.draft !== undefined) input.draft = args.draft;
      const result = await graphqlRequest<{ createSpaceNewsletter: unknown }>(
        `mutation($input: CreateSpaceNewsletterInput!) {
          createSpaceNewsletter(input: $input) {
            _id subject_preview draft scheduled_at created_at
          }
        }`,
        { input },
      );
      return result.createSpaceNewsletter;
    },
    formatResult: (result) => {
      const r = result as { _id: string; subject_preview: string; draft: boolean; scheduled_at: string | null };
      if (r && r._id) {
        const status = r.draft ? 'draft' : r.scheduled_at ? 'scheduled' : 'created';
        return `Newsletter created: ${r._id} "${r.subject_preview || '(no subject)'}" [${status}]`;
      }
      return JSON.stringify(result);
    },
  }),
  buildCapability({
    name: 'newsletter_update',
    category: 'newsletter',
    displayName: 'newsletter update',
    description: 'Update an existing newsletter.',
    params: [
      { name: 'newsletter_id', type: 'string', description: 'Newsletter ID', required: true },
      { name: 'subject', type: 'string', description: 'New email subject (HTML supported)', required: false },
      { name: 'body', type: 'string', description: 'New email body (HTML supported)', required: false },
      { name: 'cc', type: 'string', description: 'CC addresses (comma-separated)', required: false },
      { name: 'scheduled_at', type: 'string', description: 'Schedule send time (ISO 8601)', required: false },
      { name: 'recipient_types', type: 'string', description: 'Comma-separated recipient types', required: false },
      { name: 'draft', type: 'boolean', description: 'Save as draft', required: false },
      { name: 'disabled', type: 'boolean', description: 'Disable newsletter', required: false },
    ],
    whenToUse: 'when user wants to edit an existing newsletter',
    searchHint: 'update edit newsletter modify content',
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'updateSpaceNewsletter',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const input: Record<string, unknown> = { _id: args.newsletter_id };
      if (args.subject !== undefined) input.custom_subject_html = args.subject;
      if (args.body !== undefined) input.custom_body_html = args.body;
      if (args.cc !== undefined) input.cc = (args.cc as string).split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (args.scheduled_at !== undefined) {
        const d = new Date(args.scheduled_at as string);
        if (isNaN(d.getTime())) throw new Error('Invalid date for scheduled_at');
        input.scheduled_at = d.toISOString();
      }
      if (args.recipient_types !== undefined) input.recipient_types = (args.recipient_types as string).split(',').map(s => s.trim()).filter(s => s.length > 0);
      if (args.draft !== undefined) input.draft = args.draft;
      if (args.disabled !== undefined) input.disabled = args.disabled;
      const result = await graphqlRequest<{ updateSpaceNewsletter: unknown }>(
        `mutation($input: UpdateSpaceNewsletterInput!) {
          updateSpaceNewsletter(input: $input) {
            _id subject_preview draft disabled scheduled_at
          }
        }`,
        { input },
      );
      return result.updateSpaceNewsletter;
    },
    formatResult: (result) => {
      const r = result as { _id: string; subject_preview: string; draft: boolean; disabled: boolean };
      if (r && r._id) {
        return `Newsletter updated: ${r._id} "${r.subject_preview || '(no subject)'}" draft=${r.draft} disabled=${r.disabled}`;
      }
      return JSON.stringify(result);
    },
  }),
  buildCapability({
    name: 'newsletter_delete',
    category: 'newsletter',
    displayName: 'newsletter delete',
    description: 'Delete a newsletter.',
    params: [
      { name: 'newsletter_id', type: 'string', description: 'Newsletter ID', required: true },
    ],
    whenToUse: 'when user wants to delete a newsletter',
    searchHint: 'delete remove newsletter discard',
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'deleteSpaceNewsletter',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ deleteSpaceNewsletter: unknown }>(
        `mutation($_id: MongoID!) {
          deleteSpaceNewsletter(_id: $_id)
        }`,
        { _id: args.newsletter_id },
      );
      return result.deleteSpaceNewsletter;
    },
    formatResult: (result) => {
      return `Newsletter deleted: ${result}`;
    },
  }),
  buildCapability({
    name: 'newsletter_test_send',
    category: 'newsletter',
    displayName: 'newsletter test send',
    description: 'Send a test newsletter to specified email addresses.',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
      { name: 'test_recipients', type: 'string', description: 'Comma-separated test email addresses', required: true },
      { name: 'newsletter_id', type: 'string', description: 'Existing newsletter ID to test', required: false },
      { name: 'subject', type: 'string', description: 'Subject (if not using existing newsletter)', required: false },
      { name: 'body', type: 'string', description: 'Body (if not using existing newsletter)', required: false },
    ],
    whenToUse: 'when user wants to preview-send a newsletter',
    searchHint: 'test send preview newsletter email sample',
    destructive: true,
    backendType: 'mutation',
    backendResolver: 'sendSpaceNewsletterTestEmails',
    requiresEvent: false,
    execute: async (args) => {
      const input: Record<string, unknown> = {
        test_recipients: (args.test_recipients as string).split(',').map(s => s.trim()).filter(s => s.length > 0),
      };
      input.space = args.space_id;
      if (args.newsletter_id !== undefined) input._id = args.newsletter_id;
      if (args.subject !== undefined) input.custom_subject_html = args.subject;
      if (args.body !== undefined) input.custom_body_html = args.body;
      if (!input._id && (!input.custom_subject_html || !input.custom_body_html)) {
        throw new Error('Provide either newsletter_id (existing newsletter) or both subject and body (inline content)');
      }
      const result = await graphqlRequest<{ sendSpaceNewsletterTestEmails: unknown }>(
        `mutation($input: SendSpaceNewsletterTestEmailsInput!) {
          sendSpaceNewsletterTestEmails(input: $input)
        }`,
        { input },
      );
      return result.sendSpaceNewsletterTestEmails;
    },
    formatResult: (result) => {
      return `Test newsletter sent: ${result}`;
    },
  }),
  buildCapability({
    name: 'newsletter_stats',
    category: 'newsletter',
    displayName: 'newsletter stats',
    description: 'Get newsletter statistics for a space (sent, delivered, opened).',
    params: [
      { name: 'space_id', type: 'string', description: 'Space ID', required: true },
    ],
    whenToUse: 'when user wants newsletter delivery statistics',
    searchHint: 'newsletter stats open rate delivery analytics',
    destructive: false,
    backendType: 'query',
    backendResolver: 'getSpaceNewsletterStatistics',
    requiresEvent: false,
    execute: async (args) => {
      const result = await graphqlRequest<{ getSpaceNewsletterStatistics: unknown }>(
        `query($space: MongoID!) {
          getSpaceNewsletterStatistics(space: $space) {
            sent_count delivered_count open_count
          }
        }`,
        { space: args.space_id },
      );
      return result.getSpaceNewsletterStatistics;
    },
    formatResult: (result) => {
      const r = result as { sent_count: number; delivered_count: number; open_count: number };
      if (r && r.sent_count !== undefined) {
        const rate = r.delivered_count > 0 ? ((r.open_count / r.delivered_count) * 100).toFixed(1) : '0.0';
        return `Sent: ${r.sent_count}, Delivered: ${r.delivered_count}, Opened: ${r.open_count} (rate: ${rate}%)`;
      }
      return JSON.stringify(result);
    },
  }),
];
