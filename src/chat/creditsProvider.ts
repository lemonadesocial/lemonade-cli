import chalk from 'chalk';
import { graphqlRequest } from '../api/graphql.js';
import { AIProvider } from './providers/interface.js';

// Temporary migration adapter: creates the credits-mode provider.
// Uses the remote Lemonade AI backend (no local tool calling).
// See src/chat/providers/lemonade-ai.ts for capability gap documentation.
export async function createCreditsProvider(spaceId: string): Promise<AIProvider> {
  // Validate credits balance before creating provider
  let creditsChecked = false;
  let credits: { credits: number; subscription_tier: string; subscription_renewal_date?: string } | null = null;

  try {
    const balanceResult = await graphqlRequest<{ getStandCredits: { credits: number; subscription_tier: string; subscription_renewal_date?: string } | null }>(
      `query($stand_id: String!) {
        getStandCredits(stand_id: $stand_id) {
          credits subscription_tier subscription_renewal_date
        }
      }`,
      { stand_id: spaceId },
    );
    credits = balanceResult.getStandCredits;
    creditsChecked = true;
  } catch {
    // Non-fatal: continue even if balance check fails
  }

  if (creditsChecked) {
    if (!credits || (credits.credits <= 0 && credits.subscription_tier === 'free')) {
      console.error(chalk.red('  Your community is on the free plan with no AI credits.'));
      console.error(chalk.dim('  Upgrade your plan or use your own API key (run with ai_mode: own_key).'));
      process.exit(2);
    } else if (credits.credits <= 0) {
      console.log(chalk.yellow(`  Your community has 0 credits remaining. Credits renew on ${credits.subscription_renewal_date || 'next billing cycle'}.`));
      console.log(chalk.dim('  You can buy more credits with "credits buy" or switch to your own API key.'));
    }
  }

  // Discover available model from backend
  let modelName = 'Lemonade AI';
  try {
    const modelsResult = await graphqlRequest<{ getAvailableModels: Array<{ name: string; is_default: boolean }> }>(
      `query($spaceId: String) {
        getAvailableModels(spaceId: $spaceId) { name is_default }
      }`,
      { spaceId: spaceId },
    );
    const defaultModel = modelsResult.getAvailableModels.find((m) => m.is_default);
    if (defaultModel) modelName = defaultModel.name;
  } catch {
    // Non-fatal
  }

  const { LemonadeAIProvider } = await import('./providers/lemonade-ai.js');
  return new LemonadeAIProvider(modelName, spaceId);
}
