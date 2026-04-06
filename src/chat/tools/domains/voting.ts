import { ToolDef } from '../../providers/interface.js';
import { graphqlRequest } from '../../../api/graphql.js';

export const votingTools: ToolDef[] = [
  {
    name: 'event_votings',
    category: 'voting',
    displayName: 'event votings',
    description: 'List voting sessions for an event.',
    params: [
      { name: 'event_id', type: 'string', description: 'Event ID', required: true },
      { name: 'voting_ids', type: 'string', description: 'Comma-separated voting IDs to filter', required: false },
      { name: 'hidden', type: 'boolean', description: 'Include hidden votings', required: false },
    ],
    destructive: false,
    execute: async (args) => {
      const variables: Record<string, unknown> = { event: args.event_id };
      // param 'voting_ids' maps to backend arg 'votings' (array of MongoID)
      if (args.voting_ids !== undefined) {
        variables.votings = (args.voting_ids as string).split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
      if (args.hidden !== undefined) variables.hidden = args.hidden;
      // listEventVotings uses separate args (not an input wrapper) per backend schema
      const result = await graphqlRequest<{ listEventVotings: unknown }>(
        `query($event: MongoID!, $votings: [MongoID!], $hidden: Boolean) {
          listEventVotings(event: $event, votings: $votings, hidden: $hidden) {
            _id title description state start end stage timezone selected_option
            voting_options { option_id }
          }
        }`,
        variables,
      );
      return result.listEventVotings;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      const items = result as Array<{ _id: string; title: string; state: string }>;
      if (!items.length) return 'No votings found.';
      const lines = items.map(v => `  [${v._id}] "${v.title}" (${v.state ?? 'unknown'})`);
      return `${items.length} voting(s):\n${lines.join('\n')}`;
    },
  },
  {
    name: 'event_vote',
    category: 'voting',
    displayName: 'event vote',
    description: 'Cast or change a vote in an event voting session. Omit option_id to remove your vote.',
    params: [
      { name: 'voting_id', type: 'string', description: 'Voting session ID', required: true },
      { name: 'option_id', type: 'string', description: 'Option ID to vote for (omit to unvote)', required: false },
    ],
    destructive: true,
    execute: async (args) => {
      const input: Record<string, unknown> = { voting_id: args.voting_id };
      if (args.option_id !== undefined) input.option_id = args.option_id;
      const result = await graphqlRequest<{ castVote: boolean }>(
        `mutation($input: CastVoteInput!) {
          castVote(input: $input)
        }`,
        { input },
      );
      return result.castVote;
    },
    formatResult: (result) => {
      if (result === null || result === undefined) return 'Error: no response from server.';
      return result ? 'Vote submitted successfully.' : 'No changes applied.';
    },
  },
];
