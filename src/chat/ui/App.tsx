import React, { useState, useCallback } from 'react';
import { render, Box, useApp, useInput } from 'ink';
import { AIProvider, ToolDef } from '../providers/interface.js';
import { SessionState } from '../session/state.js';
import { Header } from './Header.js';
import { WelcomeBanner } from './WelcomeBanner.js';
import { MessageArea } from './MessageArea.js';
import { InputArea } from './InputArea.js';
import { StatusBar } from './StatusBar.js';
import { useChatEngine } from './hooks/useChatEngine.js';
import { useScrollable } from './hooks/useScrollable.js';

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
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [inputEmpty, setInputEmpty] = useState(true);

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

  const terminalHeight = process.stdout.rows || 24;
  const viewportHeight = Math.max(terminalHeight - 6, 5);
  const contentHeight = messages.length * 3 + (streamingText ? 3 : 0);

  const { scrollOffset, scrollUp, scrollDown, pageUp, pageDown, scrollToBottom } = useScrollable({
    contentHeight,
    viewportHeight,
    isStreaming,
  });

  useInput((input, key) => {
    if (key.upArrow && inputEmpty && !isStreaming) {
      scrollUp(1);
    } else if (key.downArrow && inputEmpty && !isStreaming) {
      scrollDown(1);
    } else if (key.pageUp) {
      pageUp();
    } else if (key.pageDown) {
      pageDown();
    }
  });

  const handleSubmit = useCallback((text: string) => {
    if (text === '/exit' || text === '/quit') {
      exit();
      return;
    }

    if (showBanner) setShowBanner(false);
    setPendingPrompt(null);
    scrollToBottom();
    sendMessage(text);
  }, [showBanner, sendMessage, exit, scrollToBottom]);

  const handleSelectPrompt = useCallback((text: string) => {
    setPendingPrompt(text);
  }, []);

  return (
    <Box flexDirection="column" height="100%">
      <Header
        providerName={provider.name}
        modelName={provider.model}
        spaceName={session.currentSpace?.title}
        tokenCount={tokenCount}
      />

      <Box flexDirection="column" flexGrow={1}>
        {showBanner && messages.length === 0 ? (
          <WelcomeBanner
            providerName={provider.name}
            modelName={provider.model}
            firstName={user.first_name || user.name}
            onSelectPrompt={handleSelectPrompt}
          />
        ) : null}

        <MessageArea
          messages={messages}
          streamingText={streamingText}
          isStreaming={isStreaming}
          scrollOffset={scrollOffset}
        />

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
        <InputArea
          onSubmit={handleSubmit}
          disabled={isStreaming}
          defaultValue={pendingPrompt ?? undefined}
          onInputChange={setInputEmpty}
        />
      ) : null}

      <StatusBar
        spaceName={session.currentSpace?.title}
        providerName={provider.name}
        modelName={provider.model}
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
