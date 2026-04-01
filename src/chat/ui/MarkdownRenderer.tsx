import React from 'react';
import { Text, Box } from 'ink';

function parseInline(text: string): React.JSX.Element[] {
  const elements: React.JSX.Element[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Status words: Published (green), Draft (yellow), Unpublished (dim), Cancelled (red)
    const statusMatch = remaining.match(/^(Published|Draft|Unpublished|Cancelled)\b/);
    if (statusMatch) {
      const word = statusMatch[1];
      let color: string | undefined;
      let dimColor = false;
      switch (word) {
        case 'Published': color = '#10B981'; break;
        case 'Draft': color = '#FDE047'; break;
        case 'Cancelled': color = '#FF637E'; break;
        case 'Unpublished': dimColor = true; break;
      }
      if (dimColor) {
        elements.push(<Text key={key++} dimColor>{word}</Text>);
      } else {
        elements.push(<Text key={key++} color={color}>{word}</Text>);
      }
      remaining = remaining.slice(word.length);
      continue;
    }

    // Bold: **text**
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      elements.push(<Text key={key++} bold>{boldMatch[1]}</Text>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic: *text*
    const italicMatch = remaining.match(/^\*(.+?)\*/);
    if (italicMatch) {
      elements.push(<Text key={key++} italic>{italicMatch[1]}</Text>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Inline code: `text`
    const codeMatch = remaining.match(/^`(.+?)`/);
    if (codeMatch) {
      elements.push(<Text key={key++} color="#F472B6">{codeMatch[1]}</Text>);
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Link: [text](url)
    const linkMatch = remaining.match(/^\[(.+?)\]\((.+?)\)/);
    if (linkMatch) {
      elements.push(<Text key={key++} color="#C4B5FD" underline>{linkMatch[1]}</Text>);
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Plain text until next special char
    const plainMatch = remaining.match(/^[^*`[]+/);
    if (plainMatch) {
      elements.push(<Text key={key++}>{plainMatch[0]}</Text>);
      remaining = remaining.slice(plainMatch[0].length);
      continue;
    }

    // Fallback: consume one char
    elements.push(<Text key={key++}>{remaining[0]}</Text>);
    remaining = remaining.slice(1);
  }

  return elements;
}

export function MarkdownRenderer({ text }: { text: string }): React.JSX.Element {
  const lines = text.split('\n');
  const elements: React.JSX.Element[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <Box key={i} marginLeft={2} marginTop={1} marginBottom={1}>
            <Text dimColor>{codeLines.join('\n')}</Text>
          </Box>,
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Table row: | col1 | col2 | col3 |
    const tableMatch = line.match(/^\|(.+)\|$/);
    if (tableMatch) {
      const cells = tableMatch[1].split('|').map(c => c.trim());
      // Skip separator rows (----)
      if (cells.every(c => /^[-:]+$/.test(c))) continue;
      elements.push(
        <Text key={i} wrap="wrap">  {cells.filter(c => c).join('  \u2022  ')}</Text>,
      );
      continue;
    }

    // Heading: # text
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      elements.push(
        <Text key={i} bold color="#FDE047">{headingMatch[2]}</Text>,
      );
      continue;
    }

    // Bullet: - text or * text
    const bulletMatch = line.match(/^\s*[-*]\s+(.+)/);
    if (bulletMatch) {
      elements.push(
        <Text key={i}>  {'\u2022'} {parseInline(bulletMatch[1])}</Text>,
      );
      continue;
    }

    // Numbered list: 1. text
    const numberedMatch = line.match(/^\s*(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      elements.push(
        <Text key={i}>  {numberedMatch[1]}. {parseInline(numberedMatch[2])}</Text>,
      );
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<Text key={i}>{''}</Text>);
      continue;
    }

    // Regular paragraph with inline formatting
    elements.push(<Text key={i} wrap="wrap">{parseInline(line)}</Text>);
  }

  return <Box flexDirection="column">{elements}</Box>;
}
