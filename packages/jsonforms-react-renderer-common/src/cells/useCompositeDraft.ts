import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  coreReducer,
  update,
  UPDATE_DATA,
  type JsonFormsCore,
  type JsonSchema,
  type Translator,
} from '@jsonforms/core';
import { useJsonForms } from '@jsonforms/react';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import { useI18nDefault } from '../locale/translate';
import { preventsEmpty } from './compositeActions';
import type { PendingChange } from '../interaction/pendingChanges';
import type { DetailDialogOptions } from '../interaction/detailDialog';

export interface CompositeDetailDialogOptions {
  [key: string]: unknown;
  dialog?: DetailDialogOptions;
  showEmptyButton?: boolean;
  disableRemove?: boolean;
  restrict?: boolean;
  emptyLabel?: string;
  cancelLabel?: string;
  okLabel?: string;
}

export interface CompositeDraftInput {
  open: boolean;
  path: string;
  schema: JsonSchema | undefined;
  enabled: boolean;
  options: CompositeDetailDialogOptions;
  t: Translator;
  onClose: () => void;
  onApply: (value: unknown) => void;
}

export type CompositeDetailDialogProps = React.PropsWithChildren<
  CompositeDraftInput & { title: string; label: string }
>;

const valueAtPath = (data: unknown, path: string) =>
  path ? get(data, path.split('.')) : data;

export const hasInvalidCompositeEditorDraft = (
  errors: JsonFormsCore['additionalErrors'],
  path: string,
) => {
  const pointer =
    '/' +
    path
      .split('.')
      .map((part) => part.replace(/~/g, '~0').replace(/\//g, '~1'))
      .join('/');
  return (errors ?? []).some(
    (error) =>
      error.params?.source === 'monaco' &&
      (error.instancePath === pointer ||
        error.instancePath.startsWith(pointer + '/')),
  );
};

function acceptsDraftUpdate(
  path: string,
  action: { type: string; path: string },
) {
  return (
    action.type === UPDATE_DATA &&
    (!path || action.path === path || action.path.startsWith(`${path}.`))
  );
}

function canEmptyCompositeValue(
  value: unknown,
  schema: CompositeDraftInput['schema'],
  options: CompositeDetailDialogOptions,
  isArray: boolean,
) {
  return (
    !options.disableRemove &&
    value != null &&
    typeof value === 'object' &&
    Object.keys(value).length > 0 &&
    (options.restrict === false || !preventsEmpty(schema, isArray))
  );
}

function useIsolatedDraft(
  parentCore: JsonFormsCore | undefined,
  path: string,
  open: boolean,
  enabled: boolean,
) {
  const [draft, setDraft] = useState<JsonFormsCore>();
  const draftRef = useRef<JsonFormsCore>();
  const [originalValue, setOriginalValue] = useState<unknown>();
  const localDispatch = useCallback(
    (action: any) => {
      const core = draftRef.current;
      if (!core || !enabled || !acceptsDraftUpdate(path, action)) return;
      const next = coreReducer(core, action);
      draftRef.current = next;
      setDraft(next);
    },
    [enabled, path],
  );
  if (open && !draft && parentCore) {
    setOriginalValue(cloneDeep(valueAtPath(parentCore.data, path)));
    setDraft({ ...parentCore, data: cloneDeep(parentCore.data) });
  }
  React.useLayoutEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  return { draft, draftRef, setDraft, originalValue, localDispatch };
}

/** Isolates detail edits until Apply, including pending writes and external-data conflicts. */
export const useCompositeDraft = ({
  open,
  path,
  schema,
  enabled,
  options,
  t,
  onClose,
  onApply,
}: CompositeDraftInput) => {
  const parent = useJsonForms();
  const invalidEditorDraft = hasInvalidCompositeEditorDraft(
    parent.core?.additionalErrors,
    path,
  );
  const defaultMessage = useI18nDefault();
  const { draft, draftRef, setDraft, originalValue, localDispatch } =
    useIsolatedDraft(parent.core, path, open, enabled);
  const pending = useMemo(() => new Set<PendingChange>(), []);
  const value = draft ? valueAtPath(draft.data, path) : undefined;
  const discardDraft = useCallback(() => {
    pending.forEach((change) => change.cancel());
    draftRef.current = undefined;
    setDraft(undefined);
  }, [draftRef, pending, setDraft]);
  const cancel = useCallback(() => {
    discardDraft();
    onClose();
  }, [discardDraft, onClose]);
  const apply = useCallback(() => {
    if (invalidEditorDraft) return;
    pending.forEach((change) => change.flush());
    const next = cloneDeep(valueAtPath(draftRef.current?.data, path));
    const changed = !isEqual(originalValue, next);
    discardDraft();
    if (changed) onApply(next);
    onClose();
  }, [
    invalidEditorDraft,
    draftRef,
    originalValue,
    pending,
    path,
    discardDraft,
    onApply,
    onClose,
  ]);
  const context = useMemo(
    () => ({ ...parent, core: draft ?? parent.core, dispatch: localDispatch }),
    [parent, draft, localDispatch],
  );
  const isArray = Array.isArray(value) || schema?.type === 'array';
  const canEmpty =
    enabled && canEmptyCompositeValue(value, schema, options, isArray);
  const conflicted =
    Boolean(draft) &&
    !isEqual(valueAtPath(parent.core?.data, path), originalValue);
  const buttonLabel = (
    override: string | undefined,
    key: 'composite.empty' | 'composite.cancel' | 'composite.apply',
  ) => (override ? t(override, override) : t(key, defaultMessage(key)));
  const clear = () => {
    pending.forEach((change) => change.cancel());
    localDispatch(update(path, () => (isArray ? [] : {})));
  };
  return {
    defaultMessage,
    pending,
    draft,
    context,
    canEmpty,
    conflicted,
    canApply: enabled && Boolean(draft) && !conflicted && !invalidEditorDraft,
    buttonLabel,
    cancel,
    apply,
    clear,
  };
};
