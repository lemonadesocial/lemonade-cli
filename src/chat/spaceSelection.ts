import chalk from 'chalk';
import readline from 'readline';
import { graphqlRequest } from '../api/graphql.js';
import { getConfig, setConfigValue } from '../auth/store.js';

interface SpaceItem {
  _id: string;
  title: string;
  slug: string;
}

export async function fetchMySpaces(): Promise<SpaceItem[]> {
  const result = await graphqlRequest<{
    aiListMySpaces: { items: SpaceItem[] };
  }>(
    'query { aiListMySpaces(limit: 100, skip: 0) { items { _id title slug } } }',
  );
  return result.aiListMySpaces.items;
}

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Prompts user to select a space for credits billing.
// Returns the selected space ID, or null if selection failed.
export async function selectCreditsSpace(
  rl: readline.Interface,
): Promise<string | null> {
  let spaces: SpaceItem[];
  try {
    spaces = await fetchMySpaces();
  } catch {
    console.log(chalk.red('  Failed to fetch your spaces. Cannot switch to credits mode.'));
    return null;
  }

  if (spaces.length === 0) {
    console.log(chalk.red('  You have no community spaces.'));
    console.log(chalk.dim('  Create a space first to use credits mode.'));
    return null;
  }

  if (spaces.length === 1) {
    const space = spaces[0];
    console.log(chalk.dim(`  Auto-selected space: ${space.title}`));
    setConfigValue('ai_credits_space', space._id);
    return space._id;
  }

  console.log('\n  Select a space for AI credits:\n');
  for (let i = 0; i < spaces.length; i++) {
    console.log(`    ${i + 1}. ${spaces[i].title} ${chalk.dim(`(${spaces[i].slug})`)}`);
  }

  const answer = await ask(rl, `\n  Enter number (1-${spaces.length}): `);
  const index = parseInt(answer.trim(), 10) - 1;

  if (isNaN(index) || index < 0 || index >= spaces.length) {
    console.log(chalk.red('  Invalid selection. Credits mode not activated.'));
    return null;
  }

  const selected = spaces[index];
  setConfigValue('ai_credits_space', selected._id);
  console.log(chalk.hex('#10B981')(`  Credits space set: ${selected.title}\n`));
  return selected._id;
}

export function getCreditsSpaceId(): string | undefined {
  return getConfig().ai_credits_space;
}

export function getCreditsSpaceDisplay(): string {
  const config = getConfig();
  return config.ai_credits_space || 'none';
}
