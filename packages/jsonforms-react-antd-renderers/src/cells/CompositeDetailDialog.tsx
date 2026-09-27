import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Button, Modal, Tooltip } from 'antd';
import {
  JsonFormsCore,
  JsonSchema,
  Translator,
  UPDATE_DATA,
  coreReducer,
  update,
} from '@jsonforms/core';
import { JsonFormsContext, useJsonForms } from '@jsonforms/react';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import { useI18nDefault } from '../util/translate';
import { CellModeProvider } from '../util/cellMode';
import { PendingChange, PendingChangesProvider } from '../util/pendingChanges';
import { preventsEmpty } from '../util/compositeActions';

export type CompositeDetailDialogOptions = {
  showEmptyButton?: boolean;
  disableRemove?: boolean;
  restrict?: boolean;
  emptyLabel?: string;
  cancelLabel?: string;
  okLabel?: string;
};

type Props = React.PropsWithChildren<{
  open: boolean;
  title: string;
  label: string;
  path: string;
  schema: JsonSchema | undefined;
  enabled: boolean;
  options: CompositeDetailDialogOptions;
  t: Translator;
  onClose: () => void;
  onApply: (value: unknown) => void;
}>;

const at = (data: unknown, path: string) =>
  path ? get(data, path.split('.')) : data;

/**
 * A detail dialog that edits an isolated copy of the form state, so nothing
 * reaches the form until Apply. Ported from the Svelte renderers'
 * `useDetailDialog`.
 *
 * The whole core is cloned rather than just the value at `path`, so `$ref`s
 * into the root schema and rules that read other parts of the data still
 * resolve while the dialog is open. Only writes are redirected: dispatch is
 * replaced with one that accepts UPDATE_DATA inside `path` and drops
 * everything else.
 */
export const CompositeDetailDialog = ({
  open,
  title,
  label,
  path,
  schema,
  enabled,
  options,
  t,
  onClose,
  onApply,
  children,
}: Props) => {
  const parent = useJsonForms();
  /*
    The default message carries the locale bundle (§6.5), so it must not be
    read straight out of the English table.
  */
  const d = useI18nDefault();
  const [draft, setDraft] = useState<JsonFormsCore | undefined>();
  // Apply has to read the draft in the same tick it flushes pending writes
  // into it, which React state cannot do.
  const draftRef = useRef<JsonFormsCore | undefined>();
  const originalRef = useRef<unknown>();
  const pending = useMemo(() => new Set<PendingChange>(), []);

  const value = draft ? at(draft.data, path) : undefined;
  const current = () => at(parent.core?.data, path);

  const localDispatch = useCallback(
    (action: any) => {
      const core = draftRef.current;
      if (!core || !enabled) return;
      if (action.type !== UPDATE_DATA) return;
      // A control outside the dialog's subtree must not be able to write
      // through the draft.
      if (path && action.path !== path && !action.path.startsWith(`${path}.`)) {
        return;
      }
      const next = coreReducer(core, action);
      draftRef.current = next;
      setDraft(next);
    },
    [enabled, path]
  );

  // Opening is driven by the parent, so the draft is taken the first time the
  // dialog renders open and released whenever it closes.
  if (open && !draft && parent.core) {
    originalRef.current = cloneDeep(current());
    const started = { ...parent.core, data: cloneDeep(parent.core.data) };
    draftRef.current = started;
    setDraft(started);
  }

  const release = useCallback(() => {
    pending.forEach((change) => change.cancel());
    draftRef.current = undefined;
    setDraft(undefined);
  }, [pending]);

  const cancel = useCallback(() => {
    release();
    onClose();
  }, [release, onClose]);

  const apply = useCallback(() => {
    // Whatever a debounced control is still holding belongs in this Apply.
    pending.forEach((change) => change.flush());
    const next = cloneDeep(at(draftRef.current?.data, path));
    const changed = !isEqual(originalRef.current, next);
    release();
    if (changed) onApply(next);
    onClose();
  }, [pending, path, release, onApply, onClose]);

  const context = useMemo(
    () => ({ ...parent, core: draft ?? parent.core, dispatch: localDispatch }),
    [parent, draft, localDispatch]
  );

  const isArray = Array.isArray(value) || schema?.type === 'array';
  const restricted = options.restrict !== false;
  const canEmpty =
    enabled &&
    !options.disableRemove &&
    value != null &&
    typeof value === 'object' &&
    Object.keys(value).length > 0 &&
    (!restricted || !preventsEmpty(schema, isArray));
  // The draft was taken from data that has since moved on, so applying it
  // would silently overwrite the newer value.
  const conflicted = Boolean(draft) && !isEqual(current(), originalRef.current);

  const text = (
    override: string | undefined,
    key: 'composite.empty' | 'composite.cancel' | 'composite.apply'
    // An option may name an i18n key of its own, or be the literal label.
  ) => (override ? t(override, override) : t(key, d(key)));

  const footer = (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
      {options.showEmptyButton === true && (
        <Tooltip
          title={t('composite.emptyTooltip', d('composite.emptyTooltip'))}
        >
          <span>
            <Button
              disabled={!canEmpty}
              onClick={() => {
                // Local only: Clear stages the empty value in the draft and
                // leaves the dialog open, like every other edit in it.
                pending.forEach((change) => change.cancel());
                localDispatch(update(path, () => (isArray ? [] : {})));
              }}
            >
              {text(options.emptyLabel, 'composite.empty')}
            </Button>
          </span>
        </Tooltip>
      )}
      <Tooltip
        title={t('composite.cancelTooltip', d('composite.cancelTooltip'))}
      >
        <Button onClick={cancel}>
          {text(options.cancelLabel, 'composite.cancel')}
        </Button>
      </Tooltip>
      <Tooltip
        title={
          conflicted
            ? t('composite.applyConflict', d('composite.applyConflict'))
            : t('composite.applyTooltip', d('composite.applyTooltip'))
        }
      >
        <span>
          <Button
            type='primary'
            disabled={!enabled || !draft || conflicted}
            onClick={apply}
          >
            {text(options.okLabel, 'composite.apply')}
          </Button>
        </span>
      </Tooltip>
    </div>
  );

  return (
    <Modal
      open={open}
      title={title}
      onCancel={cancel}
      footer={footer}
      destroyOnHidden
      width={640}
      aria-label={label}
    >
      <JsonFormsContext.Provider value={context as any}>
        <PendingChangesProvider changes={pending}>
          {/* the dialog is a normal form: labels, descriptions and inline
              messages all come back */}
          <CellModeProvider value={false}>{children}</CellModeProvider>
        </PendingChangesProvider>
      </JsonFormsContext.Provider>
    </Modal>
  );
};
