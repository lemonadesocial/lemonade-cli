import React, { useEffect, useReducer } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import {
  filterReducer,
  initialState,
  type FilterState,
  type NotificationFilter,
} from '../state.js';
import { deleteFilter, fetchFilters, upsertFilter } from '../graphql.js';
import { ListView } from './ListView.js';
import { AddEditFlow } from './AddEditFlow.js';
import { DeleteConfirm } from './DeleteConfirm.js';

export interface FilterTuiProps {
  /**
   * Optional dependency injection for tests — lets the reducer be
   * driven without the real transport. Each override mirrors the
   * corresponding helper in `graphql.ts`.
   */
  deps?: {
    fetchFilters?: () => Promise<NotificationFilter[]>;
    upsertFilter?: typeof upsertFilter;
    deleteFilter?: typeof deleteFilter;
  };
  /**
   * Callback fired when the reducer reaches `kind === 'done'` — the
   * parent in `filters/index.ts` awaits the wrapper promise and
   * propagates the exit code (IMPL Phase 3 § Anti-patterns #1: no
   * `process.exit` inside the Ink component).
   */
  onDone?: (exitCode: number) => void;
}

/** Extract an HTTP statusCode from a thrown error, best-effort. */
function statusCodeFromError(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'statusCode' in err) {
    const sc = (err as { statusCode?: unknown }).statusCode;
    if (typeof sc === 'number') return sc;
  }
  return undefined;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Unknown error';
}

/**
 * Top-level Ink component for `lemonade notifications filters`.
 *
 * Owns the `useReducer` instance and translates global key presses
 * (↑/↓/Enter/a/d/q/Esc) into reducer actions. Side effects (fetch on
 * mount, upsert/delete when `pendingMutation` transitions) live in
 * `useEffect` blocks — the reducer is pure.
 */
export function FilterTui({ deps, onDone }: FilterTuiProps): React.JSX.Element {
  const { exit } = useApp();
  const [state, dispatch] = useReducer(filterReducer, initialState);

  const fetcher = deps?.fetchFilters ?? fetchFilters;
  const upsert = deps?.upsertFilter ?? upsertFilter;
  const remove = deps?.deleteFilter ?? deleteFilter;

  // Initial load (US-4a.1).
  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((filters) => {
        if (!cancelled) dispatch({ type: 'load-success', filters });
      })
      .catch((err) => {
        if (!cancelled) dispatch({ type: 'load-error', error: errorMessage(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [fetcher]);

  // Side effect #1: upsert. Triggered by `submit` which parks a
  // pendingMutation on the state. A successful response refreshes the
  // list and dispatches `submit-success` with the new cursor target.
  useEffect(() => {
    if (state.kind !== 'add' && state.kind !== 'edit') return;
    const pending = state.pendingMutation;
    if (!pending || pending.type !== 'upsert') return;

    let cancelled = false;
    (async () => {
      try {
        const saved = await upsert(pending.input);
        const refreshed = await fetcher();
        if (cancelled) return;
        dispatch({ type: 'submit-success', filters: refreshed, focusId: saved._id });
      } catch (err) {
        if (cancelled) return;
        dispatch({
          type: 'submit-error',
          error: errorMessage(err),
          statusCode: statusCodeFromError(err),
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state, fetcher, upsert]);

  // Side effect #2: delete. Same pattern — pendingMutation triggers the
  // call, success refreshes the list and dispatches `delete-success`.
  useEffect(() => {
    if (state.kind !== 'delete-confirm') return;
    const pending = state.pendingMutation;
    if (!pending || pending.type !== 'delete') return;

    let cancelled = false;
    (async () => {
      try {
        await remove(pending.filterId);
        const refreshed = await fetcher();
        if (cancelled) return;
        dispatch({ type: 'delete-success', filters: refreshed });
      } catch (err) {
        if (cancelled) return;
        dispatch({ type: 'submit-error', error: errorMessage(err) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state, fetcher, remove]);

  // Side effect #3: clean shutdown. When the reducer reaches
  // `kind === 'done'`, surface the exit code to the outer wrapper and
  // call `useApp().exit()` to release `waitUntilExit()`.
  useEffect(() => {
    if (state.kind === 'done') {
      onDone?.(state.exitCode);
      exit();
    }
  }, [state, onDone, exit]);

  // Global key bindings — sub-views capture their own context-specific
  // keys (e.g. the enum picker's ↑/↓/Enter). We only handle navigation
  // that applies across every view.
  useInput((input, key) => {
    // Ctrl+C always quits cleanly.
    if (key.ctrl && input === 'c') {
      dispatch({ type: 'quit' });
      return;
    }

    if (state.kind === 'list') {
      if (key.upArrow) {
        dispatch({ type: 'navigate', direction: 'up' });
      } else if (key.downArrow) {
        dispatch({ type: 'navigate', direction: 'down' });
      } else if (key.return) {
        dispatch({ type: 'begin-edit' });
      } else if (input === 'a') {
        dispatch({ type: 'begin-add' });
      } else if (input === 'd') {
        dispatch({ type: 'begin-delete' });
      } else if (input === 'q' || key.escape) {
        dispatch({ type: 'quit' });
      }
      return;
    }

    if (state.kind === 'delete-confirm') {
      if (input === 'y' || input === 'Y') {
        dispatch({ type: 'confirm-delete' });
      } else {
        // Any other key cancels (US-4d.3).
        dispatch({ type: 'cancel-delete' });
      }
      return;
    }

    if (state.kind === 'add' || state.kind === 'edit') {
      if (key.escape) {
        dispatch({ type: 'back-to-list' });
      }
      // ↑/↓/Enter/input are handled inside `AddEditFlow`.
      return;
    }
  });

  return <FilterTuiView state={state} dispatch={dispatch} />;
}

interface FilterTuiViewProps {
  state: FilterState;
  dispatch: React.Dispatch<Parameters<typeof filterReducer>[1]>;
}

/**
 * Pure render function over the reducer state. Split from the hook
 * wrapper so the view can be snapshot-tested with a static state.
 */
function FilterTuiView({ state, dispatch }: FilterTuiViewProps): React.JSX.Element {
  if (state.kind === 'done') {
    return (
      <Box>
        <Text dimColor>Goodbye.</Text>
      </Box>
    );
  }

  if (state.kind === 'list') {
    return (
      <ListView
        filters={state.filters}
        cursor={state.cursor}
        status={state.status}
        error={state.error}
        info={state.info}
      />
    );
  }

  if (state.kind === 'delete-confirm') {
    const target = state.filters[state.cursor] ?? state.filters.find((f) => f._id === state.targetId);
    if (!target) {
      return (
        <Box>
          <Text color="red">Target filter missing — press any key to return.</Text>
        </Box>
      );
    }
    return <DeleteConfirm target={target} pending={!!state.pendingMutation} error={state.error} />;
  }

  return (
    <AddEditFlow
      kind={state.kind}
      step={state.step}
      draft={state.draft}
      original={state.kind === 'edit' ? state.original : undefined}
      pending={!!state.pendingMutation}
      error={state.error}
      onSetField={(field, value) => dispatch({ type: 'set-field', field, value })}
      onSetStep={(step) => dispatch({ type: 'set-step', step })}
      onSubmit={() => dispatch({ type: 'submit' })}
      onCancel={() => dispatch({ type: 'back-to-list' })}
    />
  );
}
