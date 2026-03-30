import readline from 'readline';
import { Message, ToolDef, SystemMessage } from './providers/interface';
import { AIProvider } from './providers/interface';
import { SessionState } from './session/state';
import { handleTurn } from './stream/handler';

function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}

export async function batchMode(
  provider: AIProvider,
  formattedTools: unknown[],
  systemPrompt: SystemMessage[],
  session: SessionState,
  registry: Record<string, ToolDef>,
  jsonOutput: boolean,
): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin });
  const messages: Message[] = [];

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    messages.push({ role: 'user', content: trimmed });

    try {
      await handleTurn(
        provider,
        messages,
        formattedTools,
        systemPrompt,
        session,
        registry,
        null,
        false,
      );
    } catch (err) {
      console.error(`Error: ${safeErrorMessage(err)}`);
      continue;
    }

    if (jsonOutput) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant' && Array.isArray(lastMsg.content)) {
        const textBlock = (lastMsg.content as Array<Record<string, unknown>>).find(
          (b) => b.type === 'text',
        );
        if (textBlock) {
          console.log(JSON.stringify({ text: textBlock.text }));
        }
      }
    }
  }
}
