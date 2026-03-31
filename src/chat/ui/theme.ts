import chalk from 'chalk';

export const theme = {
  // Brand
  lemon: chalk.hex('#FDE047'),
  lemonDark: chalk.hex('#FACC15'),
  violet: chalk.hex('#8B5CF6'),
  violetLight: chalk.hex('#C4B5FD'),
  pink: chalk.hex('#F472B6'),
  pinkBold: chalk.hex('#EC4899'),

  // Semantic
  success: chalk.hex('#10B981'),
  error: chalk.hex('#FF637E'),
  warning: chalk.hex('#FDE047'),

  // Text
  primary: chalk.white,
  secondary: chalk.hex('#CCCCCC'),
  tertiary: chalk.dim,
  muted: chalk.hex('#2A2930'),

  // Backgrounds
  codeBg: chalk.bgHex('#1C1B20'),
};

export const colors = {
  lemon: '#FDE047',
  lemonDark: '#FACC15',
  violet: '#8B5CF6',
  violetLight: '#C4B5FD',
  pink: '#F472B6',
  pinkBold: '#EC4899',
  success: '#10B981',
  error: '#FF637E',
  warning: '#FDE047',
  muted: '#2A2930',
} as const;
