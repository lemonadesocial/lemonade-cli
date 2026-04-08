import type { ExecutionContext } from '../../capabilities/types.js';
import type { SessionState } from '../session/state.js';

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
  type: 'tool_result';
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

export interface ProviderCapabilities {
  /** Whether this provider supports local tool-calling (tool_call events + tool_use stop reason). */
  supportsToolCalling: boolean;
}

export interface StreamParams {
  systemPrompt: SystemMessage[];
  messages: Message[];
  tools: unknown[];
  maxTokens: number;
  /** Abort signal — providers should use this to cancel in-flight requests when supported. */
  signal?: AbortSignal;
}

export interface AIProvider {
  name: string;
  model: string;
  capabilities: ProviderCapabilities;
  formatTools(tools: ToolDef[]): unknown[];
  stream(params: StreamParams): AsyncIterable<StreamEvent>;
  /** Reset provider-internal session state (e.g. server-side session ID). No-op for stateless providers. */
  resetSession?(): void;
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
  | 'number[]'
  | 'object[]'
  | { type: 'object'; properties: Record<string, ToolParam> };

export type ToolCategory = 'connector' | 'event' | 'file' | 'launchpad' | 'newsletter' | 'notifications' | 'page' | 'payment' | 'rewards' | 'session' | 'space' | 'subscription' | 'system' | 'template' | 'tempo' | 'theme' | 'tickets' | 'user' | 'voting' | 'workflow';

export interface ToolDef {
  name: string;
  category: ToolCategory;
  displayName: string;
  description: string;
  params: ToolParam[];
  destructive: boolean;
  execute: (args: Record<string, unknown>, context?: ExecutionContext) => Promise<unknown>;
  formatResult?: (result: unknown) => string;
  backendType?: 'query' | 'mutation' | 'none';
  sessionUpdates?: {
    field: keyof SessionState;
    extract: (result: unknown) => unknown;
  }[];
}
