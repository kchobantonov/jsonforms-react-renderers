import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@jsonforms-react-shadcn-ui/dialog';
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
import { useI18nDefault } from '@chobantonov/jsonforms-react-renderer-common/translate';
import { ShadcnCellMode } from './asCell';
import {
  PendingChange,
  PendingChangesProvider,
} from '@chobantonov/jsonforms-react-renderer-common/pendingChanges';
import { preventsEmpty } from '@chobantonov/jsonforms-react-renderer-common/compositeActions';

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

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) cancel();
      }}
    >
      <DialogContent
        className='max-w-2xl'
        aria-label={label}
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <JsonFormsContext.Provider value={context as any}>
          <PendingChangesProvider changes={pending}>
            <ShadcnCellMode.Provider value={false}>
              <div className='max-h-[65vh] overflow-auto p-1'>{children}</div>
            </ShadcnCellMode.Provider>
          </PendingChangesProvider>
        </JsonFormsContext.Provider>
        {conflicted && (
          <p role='alert'>
            {t('composite.applyConflict', d('composite.applyConflict'))}
          </p>
        )}
        <DialogFooter>
          {options.showEmptyButton === true && (
            <Button
              type='button'
              variant='outline'
              disabled={!canEmpty}
              onClick={() => {
                pending.forEach((change) => change.cancel());
                localDispatch(update(path, () => (isArray ? [] : {})));
              }}
            >
              {text(options.emptyLabel, 'composite.empty')}
            </Button>
          )}
          <Button type='button' variant='outline' onClick={cancel}>
            {text(options.cancelLabel, 'composite.cancel')}
          </Button>
          <Button
            type='button'
            disabled={!enabled || !draft || conflicted}
            onClick={apply}
          >
            {text(options.okLabel, 'composite.apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
