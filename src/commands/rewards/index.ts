import { Command } from 'commander';
import { graphqlRequest } from '../../api/graphql.js';
import { jsonSuccess } from '../../output/json.js';
import { renderTable, renderKeyValue } from '../../output/table.js';
import { handleError } from '../../output/error.js';
import { setFlagApiKey } from '../../auth/store.js';

export function registerRewardCommands(program: Command): void {
  const rewards = program
    .command('rewards')
    .description('Manage rewards and payouts');

  rewards
    .command('balance')
    .description('View reward balance')
    .requiredOption('--space <id>', 'Space ID')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const result = await graphqlRequest<{ atlasRewardSummary: Record<string, unknown> }>(
          `query($space: String!) {
            atlasRewardSummary(space: $space) {
              organizer_accrued_usdc organizer_pending_usdc organizer_paid_out_usdc
              attendee_accrued_usdc attendee_pending_usdc attendee_paid_out_usdc
              volume_tier monthly_gmv_usdc next_tier_threshold_usdc
              next_payout_date is_self_verified verification_cta_extra_usdc
            }
          }`,
          { space: opts.space },
        );
        setFlagApiKey(undefined);

        const s = result.atlasRewardSummary;
        if (opts.json) {
          console.log(jsonSuccess(s));
        } else {
          console.log(renderKeyValue([
            ['Organizer Accrued', `${s.organizer_accrued_usdc} USDC`],
            ['Organizer Pending', `${s.organizer_pending_usdc} USDC`],
            ['Organizer Paid Out', `${s.organizer_paid_out_usdc} USDC`],
            ['Attendee Accrued', `${s.attendee_accrued_usdc} USDC`],
            ['Attendee Pending', `${s.attendee_pending_usdc} USDC`],
            ['Attendee Paid Out', `${s.attendee_paid_out_usdc} USDC`],
            ['Volume Tier', String(s.volume_tier)],
            ['Monthly GMV', `${s.monthly_gmv_usdc} USDC`],
            ['Next Payout', String(s.next_payout_date || '-')],
            ['Verified', s.is_self_verified ? 'Yes' : 'No'],
          ]));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  rewards
    .command('history')
    .description('View reward history')
    .requiredOption('--space <id>', 'Space ID')
    .option('--limit <n>', 'Max results', '20')
    .option('--offset <n>', 'Skip results', '0')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const limit = Math.min(parseInt(opts.limit, 10), 100);
        const offset = parseInt(opts.offset, 10);

        const result = await graphqlRequest<{ atlasRewardHistory: Array<Record<string, unknown>> }>(
          `query($space: String!, $limit: Int, $offset: Int) {
            atlasRewardHistory(space: $space, limit: $limit, offset: $offset) {
              _id event_id gross_amount_usdc
              organizer_cashback_usdc attendee_cashback_usdc
              organizer_volume_bonus_usdc attendee_discovery_bonus_usdc
              payment_method status created_at
            }
          }`,
          { space: opts.space, limit, offset },
        );
        setFlagApiKey(undefined);

        const items = result.atlasRewardHistory;
        if (opts.json) {
          console.log(jsonSuccess(items));
        } else {
          console.log(renderTable(
            ['Date', 'Gross', 'Org Cashback', 'Att Cashback', 'Method', 'Status'],
            items.map((r) => [
              String(r.created_at || ''),
              String(r.gross_amount_usdc),
              String(r.organizer_cashback_usdc),
              String(r.attendee_cashback_usdc),
              String(r.payment_method),
              String(r.status),
            ]),
          ));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  rewards
    .command('payouts')
    .description('View payout history')
    .option('--limit <n>', 'Max results', '20')
    .option('--offset <n>', 'Skip results', '0')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (opts) => {
      try {
        setFlagApiKey(opts.apiKey);
        const limit = Math.min(parseInt(opts.limit, 10), 100);
        const offset = parseInt(opts.offset, 10);

        const result = await graphqlRequest<{ atlasPayoutHistory: Array<Record<string, unknown>> }>(
          `query($limit: Int, $offset: Int) {
            atlasPayoutHistory(limit: $limit, offset: $offset) {
              amount_usdc payout_method tx_hash stripe_transfer_id status processed_at
            }
          }`,
          { limit, offset },
        );
        setFlagApiKey(undefined);

        const items = result.atlasPayoutHistory;
        if (opts.json) {
          console.log(jsonSuccess(items));
        } else {
          console.log(renderTable(
            ['Amount', 'Method', 'TX Hash', 'Stripe ID', 'Status', 'Date'],
            items.map((p) => [
              `${p.amount_usdc} USDC`,
              String(p.payout_method),
              String(p.tx_hash || '-'),
              String(p.stripe_transfer_id || '-'),
              String(p.status),
              String(p.processed_at || ''),
            ]),
          ));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  rewards
    .command('referral')
    .description('Manage referral codes')
    .option('--generate', 'Generate a new referral code')
    .option('--apply <code>', 'Apply a referral code')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (opts) => {
      try {
        setFlagApiKey(opts.apiKey);

        if (opts.generate) {
          const result = await graphqlRequest<{ atlasGenerateReferralCode: { code: string } }>(
            'mutation { atlasGenerateReferralCode { code } }',
          );
          setFlagApiKey(undefined);

          if (opts.json) {
            console.log(jsonSuccess(result.atlasGenerateReferralCode));
          } else {
            console.log(`Referral code: ${result.atlasGenerateReferralCode.code}`);
          }
          return;
        }

        if (opts.apply) {
          await graphqlRequest(
            'mutation($code: String!) { atlasApplyReferralCode(code: $code) }',
            { code: opts.apply },
          );
          setFlagApiKey(undefined);

          if (opts.json) {
            console.log(jsonSuccess({ applied: true }));
          } else {
            console.log('Referral code applied.');
          }
          return;
        }

        const result = await graphqlRequest<{ atlasReferralSummary: Record<string, unknown> }>(
          'query { atlasReferralSummary { code total_referrals total_reward_usdc } }',
        );
        setFlagApiKey(undefined);

        const s = result.atlasReferralSummary;
        if (opts.json) {
          console.log(jsonSuccess(s));
        } else {
          console.log(renderKeyValue([
            ['Code', String(s.code || 'None')],
            ['Total Referrals', String(s.total_referrals)],
            ['Total Reward', `${s.total_reward_usdc} USDC`],
          ]));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });

  rewards
    .command('settings')
    .description('View or update payout settings')
    .option('--wallet <address>', 'Set payout wallet address')
    .option('--chain <chain-id>', 'Set payout chain')
    .option('--preferred <method>', 'Set preferred method: stripe|crypto')
    .option('--json', 'Output as JSON')
    .option('--api-key <key>', 'API key override')
    .action(async (opts) => {
      try {
        setFlagApiKey(opts.apiKey);

        const hasWriteFlags = opts.wallet || opts.chain || opts.preferred;

        if (hasWriteFlags) {
          if (opts.wallet && !/^0x[a-fA-F0-9]{40}$/.test(opts.wallet)) {
            throw new Error('Invalid wallet address format. Expected 0x + 40 hex characters.');
          }

          const input: Record<string, unknown> = {};
          if (opts.wallet) input.wallet_address = opts.wallet;
          if (opts.chain) input.wallet_chain = opts.chain;
          if (opts.preferred) input.preferred_method = opts.preferred;

          const result = await graphqlRequest<{ atlasUpdatePayoutSettings: Record<string, unknown> }>(
            `mutation($input: AtlasPayoutSettingsInput!) {
              atlasUpdatePayoutSettings(input: $input) {
                wallet_address wallet_chain stripe_connect_account_id preferred_method
              }
            }`,
            { input },
          );
          setFlagApiKey(undefined);

          const s = result.atlasUpdatePayoutSettings;
          if (opts.json) {
            console.log(jsonSuccess(s));
          } else {
            console.log('Payout settings updated.');
            console.log(renderKeyValue([
              ['Wallet', String(s.wallet_address || '-')],
              ['Chain', String(s.wallet_chain || '-')],
              ['Preferred', String(s.preferred_method || '-')],
            ]));
          }
          return;
        }

        const result = await graphqlRequest<{ atlasGetPayoutSettings: Record<string, unknown> }>(
          `query {
            atlasGetPayoutSettings {
              wallet_address wallet_chain stripe_connect_account_id preferred_method
            }
          }`,
        );
        setFlagApiKey(undefined);

        const s = result.atlasGetPayoutSettings;
        if (opts.json) {
          console.log(jsonSuccess(s));
        } else {
          console.log(renderKeyValue([
            ['Wallet', String(s.wallet_address || '-')],
            ['Chain', String(s.wallet_chain || '-')],
            ['Stripe', s.stripe_connect_account_id ? 'Connected' : 'Not connected'],
            ['Preferred', String(s.preferred_method || '-')],
          ]));
        }
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, opts.json);
      }
    });
}
