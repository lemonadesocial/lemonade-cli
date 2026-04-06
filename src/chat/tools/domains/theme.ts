import { buildCapability } from '../../../capabilities/factory.js';
import { CanonicalCapability } from '../../../capabilities/types.js';

export const themeTools: CanonicalCapability[] = [
  buildCapability({
    name: 'theme_build',
    category: 'theme',
    displayName: 'theme build',
    description: 'Build a theme_data JSON object from named parameters. Returns JSON to use with event/space create or update tools.',
    params: [
      { name: 'preset', type: 'string', description: 'Theme preset', required: false, default: 'default', enum: ['default', 'minimal', 'shader', 'pattern', 'image', 'passport'] },
      { name: 'mode', type: 'string', description: 'Color mode', required: false, default: 'dark', enum: ['dark', 'light', 'auto'] },
      { name: 'color', type: 'string', description: 'Accent color', required: false, enum: ['violet', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'purple', 'fuchsia', 'pink', 'rose'] },
      { name: 'shader', type: 'string', description: 'Shader name (when preset is shader)', required: false, enum: ['dreamy', 'summer', 'melon', 'barbie', 'sunset', 'ocean', 'forest', 'lavender'] },
      { name: 'pattern', type: 'string', description: 'Pattern name (when preset is pattern)', required: false, enum: ['cross', 'hypnotic', 'plus', 'polkadot', 'wave', 'zigzag'] },
      { name: 'font_title', type: 'string', description: 'Title font', required: false, default: 'default' },
      { name: 'font_body', type: 'string', description: 'Body font', required: false, default: 'default' },
    ],
    whenToUse: 'when user wants to build a theme configuration',
    searchHint: 'theme build design colors style preset',
    destructive: false,
    backendType: 'none',
    backendService: 'local',
    requiresSpace: false,
    requiresEvent: false,
    execute: async (args) => {
      const themeData: Record<string, unknown> = {
        theme: (args.preset as string) || 'default',
        config: {
          mode: (args.mode as string) || 'dark',
        },
        font_title: (args.font_title as string) || 'default',
        font_body: (args.font_body as string) || 'default',
      };

      const config = themeData.config as Record<string, unknown>;
      if (args.color !== undefined) config.color = args.color;

      const preset = themeData.theme as string;
      if (args.shader !== undefined && preset !== 'shader') {
        throw new Error('shader param only applies when preset is "shader"');
      }
      if (args.pattern !== undefined && preset !== 'pattern') {
        throw new Error('pattern param only applies when preset is "pattern"');
      }
      if (preset === 'shader' && args.shader === undefined) {
        throw new Error('shader name is required when preset is "shader" (options: dreamy, summer, melon, barbie, sunset, ocean, forest, lavender)');
      }
      if (preset === 'pattern' && args.pattern === undefined) {
        throw new Error('pattern name is required when preset is "pattern" (options: cross, hypnotic, plus, polkadot, wave, zigzag)');
      }
      if (preset === 'shader' && args.shader !== undefined) config.name = args.shader;
      if (preset === 'pattern' && args.pattern !== undefined) config.name = args.pattern;

      return themeData;
    },
    formatResult: (result) => {
      const json = JSON.stringify(result, null, 2);
      return `Theme data built:\n${json}\n\nUse this JSON as the theme_data parameter when creating or updating an event or space.`;
    },
  }),
];
