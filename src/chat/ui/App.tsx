import React, { useState } from 'react';
import { render, Box, useApp } from 'ink';
import { AIProvider, ToolDef } from '../providers/interface.js';
import { SessionState } from '../session/state.js';
import { Header } from './Header.js';
import { WelcomeBanner } from './WelcomeBanner.js';
import { MessageArea } from './MessageArea.js';
import { InputArea } from './InputArea.js';
import { StatusBar } from './StatusBar.js';
import { useChatEngine } from './hooks/useChatEngine.js';

interface AppProps {
  provider: AIProvider;
  session: SessionState;
  registry: Record<string, ToolDef>;
  formattedTools: unknown[];
  user: { _id: string; name: string; email: string; first_name: string };
}

function App({ provider, session, registry, formattedTools, user }: AppProps): React.ReactElement {
  const { exit } = useApp();
  const [showBanner, setShowBanner] = useState(true);

  const {
    messages,
    streamingText,
    isStreaming,
    tokenCount,
    streamTokenCount,
    lastError,
    lastToolName,
    sendMessage,
    pendingConfirmation,
    confirmAction,
  } = useChatEngine({ provider, session, registry, formattedTools });

  const handleSubmit = (text: string) => {
    if (text === '/exit' || text === '/quit') {
      exit();
      return;
    }

    if (showBanner) setShowBanner(false);
    sendMessage(text);
  };

  const modelName = (provider as unknown as { model?: string }).model || provider.name;

  return (
    <Box flexDirection="column" height="100%">
      <Header
        providerName={provider.name}
        modelName={modelName}
        spaceName={session.currentSpace?.title}
        tokenCount={tokenCount}
      />

      <Box flexDirection="column" flexGrow={1}>
        {showBanner && messages.length === 0 ? (
          <WelcomeBanner
            providerName={provider.name}
            modelName={modelName}
            firstName={user.first_name || user.name}
          />
        ) : null}

        <MessageArea messages={messages} streamingText={streamingText} />

        {pendingConfirmation ? (
          <Box paddingX={1}>
            <InputArea
              onSubmit={(answer) => {
                confirmAction(
                  pendingConfirmation.id,
                  ['yes', 'y'].includes(answer.toLowerCase()),
                );
              }}
              disabled={false}
            />
          </Box>
        ) : null}
      </Box>

      {!pendingConfirmation ? (
        <InputArea onSubmit={handleSubmit} disabled={isStreaming} />
      ) : null}

      <StatusBar
        spaceName={session.currentSpace?.title}
        providerName={provider.name}
        modelName={modelName}
        isStreaming={isStreaming}
        streamTokenCount={streamTokenCount}
        lastError={lastError}
        lastToolName={lastToolName}
      />
    </Box>
  );
}

export async function renderApp(props: AppProps): Promise<void> {
  const instance = render(<App {...props} />, { exitOnCtrlC: true });
  await instance.waitUntilExit();
}
