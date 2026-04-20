import React, { useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_FILTER_MODES,
  NOTIFICATION_REF_TYPES,
  NOTIFICATION_TYPES,
} from '../../../../chat/tools/domains/notifications.js';
import type {
  FilterCategory,
  FilterDraft,
  FilterField,
  FilterMode,
  FilterRefType,
  FilterType,
} from '../state.js';
import { ADD_EDIT_STEPS, CONFIRM_STEP } from '../state.js';

/**
 * Best-effort category → type mapping derived from the shared
 * `NOTIFICATION_TYPES` list in
 * `src/chat/tools/domains/notifications.ts:15-77`. The backend enforces no
 * hard coupling between `notification_category` and `notification_type`
 * (both are optional on `NotificationFilterInput`), so this map is a UX
 * assist — users can still pick "any" type regardless of category.
 */
const CATEGORY_TYPE_MAP: Record<FilterCategory, readonly FilterType[]> = {
  event: NOTIFICATION_TYPES.filter((t) => t.startsWith('event_') || t === 'ticket_assigned' || t === 'ticket_cancelled') as readonly FilterType[],
  social: NOTIFICATION_TYPES.filter((t) => t.startsWith('user_')) as readonly FilterType[],
  messaging: NOTIFICATION_TYPES.filter((t) => t === 'chat_message' || t === 'xmtp_message') as readonly FilterType[],
  payment: NOTIFICATION_TYPES.filter((t) => t.startsWith('payment') || t.startsWith('ticket_')) as readonly FilterType[],
  space: NOTIFICATION_TYPES.filter((t) => t.startsWith('space_')) as readonly FilterType[],
  store: NOTIFICATION_TYPES.filter((t) => t.startsWith('store_')) as readonly FilterType[],
  system: NOTIFICATION_TYPES.filter((t) =>
    t === 'stripe_connected' || t === 'email_send_failed' || t === 'admin_payment_verification' || t.startsWith('safe_vault_'),
  ) as readonly FilterType[],
};

export interface AddEditFlowProps {
  kind: 'add' | 'edit';
  step: number;
  draft: FilterDraft;
  original?: FilterDraft;
  pending: boolean;
  error?: string;
  /** Set a field (undefined clears). */
  onSetField: (field: FilterField, value: string | undefined) => void;
  /** Advance to a specific step (0-based, max CONFIRM_STEP). */
  onSetStep: (step: number) => void;
  /** Submit the resolved draft via the parent's `useEffect`. */
  onSubmit: () => void;
  /** Bail out without submitting — caller dispatches `back-to-list`. */
  onCancel: () => void;
}

interface RunningPayloadProps {
  draft: FilterDraft;
  original?: FilterDraft;
}

/**
 * Render the running payload alongside each step (US-4b.2). Highlights
 * fields that differ from `original` (US-4c.2 — edit mode only).
 */
function RunningPayload({ draft, original }: RunningPayloadProps): React.JSX.Element {
  const fields: Array<[FilterField, string | undefined]> = [
    ['mode', draft.mode],
    ['notification_category', draft.notification_category],
    ['notification_type', draft.notification_type],
    ['ref_type', draft.ref_type],
    ['ref_id', draft.ref_id],
    ['space_scoped', draft.space_scoped],
  ];
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text dimColor>Payload:</Text>
      {fields.map(([key, value]) => {
        const changed = original !== undefined && (original[key] ?? undefined) !== (value ?? undefined);
        const display = value === undefined || value === '' ? '(unset)' : String(value);
        return (
          <Text key={key} color={changed ? 'yellow' : undefined}>
            {'  '}
            {key}: {display}
            {changed ? ' *' : ''}
          </Text>
        );
      })}
    </Box>
  );
}

interface EnumStepProps<T extends string> {
  title: string;
  options: readonly T[];
  allowAny: boolean;
  current: T | undefined;
  onPick: (value: T | undefined) => void;
  onSkip?: () => void;
}

/**
 * Enum picker: ↑/↓ scrolls candidates (including "any" when allowed),
 * Enter accepts. Isolates local cursor state so the parent reducer
 * stays pure.
 */
function EnumStep<T extends string>({ title, options, allowAny, current, onPick }: EnumStepProps<T>): React.JSX.Element {
  const choices = useMemo(() => {
    return allowAny ? ['(any)', ...options] : [...options];
  }, [options, allowAny]);
  const initialIdx = useMemo(() => {
    if (current === undefined) return 0;
    const idx = choices.indexOf(current as string);
    return idx >= 0 ? idx : 0;
  }, [choices, current]);
  const [cursor, setCursor] = useState(initialIdx);

  useInput((input, key) => {
    if (key.upArrow) {
      setCursor((c) => Math.max(0, c - 1));
    } else if (key.downArrow) {
      setCursor((c) => Math.min(choices.length - 1, c + 1));
    } else if (key.return) {
      const picked = choices[cursor];
      if (allowAny && picked === '(any)') {
        onPick(undefined);
      } else {
        onPick(picked as T);
      }
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold>{title}</Text>
      <Box flexDirection="column" marginTop={1}>
        {choices.map((c, idx) => (
          <Text key={c} color={idx === cursor ? 'cyan' : undefined}>
            {idx === cursor ? '> ' : '  '}
            {c}
          </Text>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>↑/↓ choose · Enter confirm · Esc cancel</Text>
      </Box>
    </Box>
  );
}

interface TextStepProps {
  title: string;
  placeholder: string;
  initial: string | undefined;
  onSubmit: (value: string | undefined) => void;
}

/**
 * Free-text input step (ref_id, space_scoped). Blank Enter clears the
 * field.
 */
function TextStep({ title, placeholder, initial, onSubmit }: TextStepProps): React.JSX.Element {
  const [value, setValue] = useState(initial ?? '');

  useInput((input, key) => {
    if (key.return) {
      onSubmit(value.trim() === '' ? undefined : value.trim());
      return;
    }
    if (key.backspace || key.delete) {
      setValue((v) => v.slice(0, -1));
      return;
    }
    if (key.ctrl || key.meta) return;
    if (input && input.length > 0 && !key.upArrow && !key.downArrow && !key.leftArrow && !key.rightArrow) {
      setValue((v) => v + input);
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold>{title}</Text>
      <Box marginTop={1}>
        <Text>{'> '}</Text>
        <Text>{value}</Text>
        {value === '' ? <Text dimColor>  {placeholder}</Text> : null}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Enter submit (blank = unset) · Esc cancel</Text>
      </Box>
    </Box>
  );
}

interface ConfirmStepProps {
  kind: 'add' | 'edit';
  draft: FilterDraft;
  original?: FilterDraft;
  pending: boolean;
  error?: string;
  onSubmit: () => void;
}

function ConfirmStep({ kind, draft, original, pending, error, onSubmit }: ConfirmStepProps): React.JSX.Element {
  useInput((_input, key) => {
    if (key.return && !pending) {
      onSubmit();
    }
  });
  return (
    <Box flexDirection="column">
      <Text bold>{kind === 'add' ? 'Confirm new filter' : 'Confirm filter update'}</Text>
      <RunningPayload draft={draft} original={original} />
      {pending ? (
        <Box marginTop={1}>
          <Text dimColor>Submitting…</Text>
        </Box>
      ) : null}
      {error ? (
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      ) : null}
      <Box marginTop={1}>
        <Text dimColor>Enter submit · Esc cancel (your input is preserved)</Text>
      </Box>
    </Box>
  );
}

/**
 * Multi-step add/edit flow (US-4b.1-6 / US-4c.1-5). Step order:
 * 0 mode → 1 category → 2 type → 3 ref_type → 4 ref_id → 5 space_scoped
 * → 6 confirm.
 *
 * Each step dispatches a `set-field` action to the parent reducer and
 * advances the step. The parent owns `useEffect` side-effects keyed on
 * `pendingMutation` (IMPL Phase 3 § Anti-patterns #2).
 */
export function AddEditFlow(props: AddEditFlowProps): React.JSX.Element {
  const { kind, step, draft, original, pending, error, onSetField, onSetStep, onSubmit } = props;

  const stepLabel = ADD_EDIT_STEPS[step] ?? 'confirm';
  const header = `${kind === 'add' ? 'Add filter' : 'Edit filter'} · step ${step + 1}/${ADD_EDIT_STEPS.length} (${stepLabel})`;

  // Category-constrained types: when a category is set we narrow the
  // type choices per the shared mapping (US-4b.1). Otherwise we expose
  // the full `NOTIFICATION_TYPES` list.
  const typeOptions = useMemo<readonly FilterType[]>(() => {
    if (draft.notification_category && CATEGORY_TYPE_MAP[draft.notification_category]) {
      const scoped = CATEGORY_TYPE_MAP[draft.notification_category];
      return scoped.length > 0 ? scoped : NOTIFICATION_TYPES;
    }
    return NOTIFICATION_TYPES;
  }, [draft.notification_category]);

  const renderStep = (): React.JSX.Element => {
    switch (step) {
      case 0:
        return (
          <EnumStep<FilterMode>
            title="Mode (required): mute | hide | only"
            options={NOTIFICATION_FILTER_MODES}
            allowAny={false}
            current={draft.mode}
            onPick={(value) => {
              if (value !== undefined) {
                onSetField('mode', value);
                onSetStep(1);
              }
            }}
          />
        );
      case 1:
        return (
          <EnumStep<FilterCategory>
            title="Category (optional)"
            options={NOTIFICATION_CATEGORIES}
            allowAny
            current={draft.notification_category}
            onPick={(value) => {
              onSetField('notification_category', value);
              onSetStep(2);
            }}
          />
        );
      case 2:
        return (
          <EnumStep<FilterType>
            title="Notification type (optional)"
            options={typeOptions}
            allowAny
            current={draft.notification_type}
            onPick={(value) => {
              onSetField('notification_type', value);
              onSetStep(3);
            }}
          />
        );
      case 3:
        return (
          <EnumStep<FilterRefType>
            title="Reference type (optional)"
            options={NOTIFICATION_REF_TYPES}
            allowAny
            current={draft.ref_type}
            onPick={(value) => {
              onSetField('ref_type', value);
              // Skip ref_id step when ref_type is cleared.
              onSetStep(value === undefined ? 5 : 4);
            }}
          />
        );
      case 4:
        return (
          <TextStep
            title={`Reference ID for ${draft.ref_type ?? ''} (optional, MongoID)`}
            placeholder="e.g. 65f4…"
            initial={draft.ref_id}
            onSubmit={(value) => {
              onSetField('ref_id', value);
              onSetStep(5);
            }}
          />
        );
      case 5:
        return (
          <TextStep
            title="Space-scoped ID (optional, MongoID)"
            placeholder="e.g. 65f4…"
            initial={draft.space_scoped}
            onSubmit={(value) => {
              onSetField('space_scoped', value);
              onSetStep(CONFIRM_STEP);
            }}
          />
        );
      case CONFIRM_STEP:
      default:
        return (
          <ConfirmStep
            kind={kind}
            draft={draft}
            original={original}
            pending={pending}
            error={error}
            onSubmit={onSubmit}
          />
        );
    }
  };

  return (
    <Box flexDirection="column">
      <Text bold>{header}</Text>
      <Box marginTop={1}>{renderStep()}</Box>
      {step !== CONFIRM_STEP ? <RunningPayload draft={draft} original={original} /> : null}
    </Box>
  );
}
