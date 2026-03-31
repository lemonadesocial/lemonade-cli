import React, { useState, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from './theme.js';

interface ConfirmPromptProps {
  description: string;
  onConfirm: (confirmed: boolean) => void;
}

export function ConfirmPrompt({ description, onConfirm }: ConfirmPromptProps): React.ReactElement {
  const [answered, setAnswered] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [display, setDisplay] = useState('');
  const bufferRef = useRef('');
  const answeredRef = useRef(false);

  useInput((ch, key) => {
    if (answeredRef.current) return;

    if (key.return) {
      const accepted = ['yes', 'y'].includes(bufferRef.current.trim().toLowerCase());
      answeredRef.current = true;
      setAnswered(true);
      if (!accepted) setDeclined(true);
      onConfirm(accepted);
      return;
    }

    if (key.backspace || key.delete) {
      bufferRef.current = bufferRef.current.slice(0, -1);
      setDisplay(bufferRef.current);
      return;
    }

    if (ch && !key.ctrl && !key.meta) {
      bufferRef.current += ch;
      setDisplay(bufferRef.current);
    }
  });

  if (answered && declined) {
    return (
      <Box paddingLeft={2}>
        <Text dimColor>Cancelled</Text>
      </Box>
    );
  }

  if (answered) {
    return <Box />;
  }

  return (
    <Box flexDirection="column" paddingLeft={1}>
      <Box>
        <Text color={colors.warning}>! </Text>
        <Text color={colors.warning}>{description}</Text>
      </Box>
      <Box paddingLeft={2}>
        <Text dimColor>Confirm? (yes/no): </Text>
        <Text>{display}</Text>
      </Box>
    </Box>
  );
}
