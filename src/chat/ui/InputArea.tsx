import React from 'react';
import { Box, Text } from 'ink';
import { TextInput } from '@inkjs/ui';
import { colors } from './theme.js';

interface InputAreaProps {
  onSubmit: (text: string) => void;
  disabled: boolean;
  defaultValue?: string;
  onChange?: (value: string) => void;
  suggestions?: string[];
}

export function InputArea({ onSubmit, disabled, defaultValue, onChange, suggestions }: InputAreaProps): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Box borderStyle="single" borderColor={colors.muted} borderTop={true} borderBottom={false} borderLeft={false} borderRight={false} />
      <Box paddingX={1}>
        <Text color={disabled ? colors.muted : colors.lemon}>&gt; </Text>
        {disabled ? (
          <Text dimColor>...</Text>
        ) : (
          <TextInput
            onSubmit={onSubmit}
            placeholder="Type a message..."
            defaultValue={defaultValue}
            onChange={onChange}
            suggestions={suggestions}
          />
        )}
      </Box>
    </Box>
  );
}
