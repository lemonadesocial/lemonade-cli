export interface StreamEvent {
  type: 'text_delta' | 'tool_call' | 'done';
  text?: string;
  toolCall?: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  };
  stopReason?: 'end_turn' | 'tool_use';
  usage?: { input_tokens: number; output_tokens: number };
}

export interface ToolResultMessage {
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string | ContentBlock[] | ToolResultMessage[];
}

export interface ContentBlock {
  type: string;
  [key: string]: unknown;
}

export interface SystemMessage {
  type: 'text';
  text: string;
  cache_control?: { type: 'ephemeral' };
}

export interface AIProvider {
  name: string;
  model: string;
  formatTools(tools: ToolDef[]): unknown[];
  stream(params: {
    systemPrompt: SystemMessage[];
    messages: Message[];
    tools: unknown[];
    maxTokens: number;
  }): AsyncIterable<StreamEvent>;
}

export interface ToolParam {
  name: string;
  type: ParamType;
  description: string;
  required: boolean;
  default?: string | number | boolean;
  enum?: string[];
}

export type ParamType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'string[]'
  | { type: 'object'; properties: Record<string, ToolParam> };

export interface ToolDef {
  name: string;
  displayName: string;
  description: string;
  params: ToolParam[];
  destructive: boolean;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}
