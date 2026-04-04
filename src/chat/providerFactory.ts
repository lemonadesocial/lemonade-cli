import { AIProvider } from './providers/interface.js';

export const VALID_PROVIDERS = ['anthropic', 'openai'] as const;
export type ByokProviderName = (typeof VALID_PROVIDERS)[number];

export function isValidProvider(name: string): name is ByokProviderName {
  return (VALID_PROVIDERS as readonly string[]).includes(name);
}

export async function createByokProvider(
  providerName: ByokProviderName,
  apiKey: string,
  model?: string,
): Promise<AIProvider> {
  if (!isValidProvider(providerName)) {
    throw new Error(`Unknown provider "${providerName}". Supported: ${VALID_PROVIDERS.join(', ')}`);
  }

  const resolvedModel = model || process.env.MAKE_LEMONADE_MODEL;

  if (providerName === 'openai') {
    const { OpenAIProvider } = await import('./providers/openai.js');
    return new OpenAIProvider(apiKey, resolvedModel);
  }

  const { AnthropicProvider } = await import('./providers/anthropic.js');
  return new AnthropicProvider(apiKey, resolvedModel);
}
