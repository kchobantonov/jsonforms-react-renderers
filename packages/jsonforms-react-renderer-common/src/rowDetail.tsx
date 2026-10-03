import { findDetailUISchema as findUISchema } from './detail';
import { PendingChange, PendingChangesProvider } from './pendingChanges';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  coreReducer,
  Generate,
  JsonFormsCore,
  Resolve,
  UPDATE_DATA,
  update,
} from '@jsonforms/core';
import {
  JsonFormsContext,
  JsonFormsDispatch,
  useJsonForms,
} from '@jsonforms/react';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import { useI18n } from './translate';

export const useRowDetail = (props: any) => {
  const context = useJsonForms();
  const pending = useMemo(() => new Set<PendingChange>(), []);
  const t = useI18n();
  const options = props.uischema?.options?.rowDetail;
  const [panelOpen, setPanelOpen] = useState(() => options?.collapsed !== true);
  const [selection, setSelection] = useState<{
    index: number;
    source: unknown;
    draft?: JsonFormsCore;
  }>();
  const draftRef = useRef<JsonFormsCore>();
  const array = Resolve.data(context.core?.data, props.path) as
    | unknown[]
    | undefined;
  const previousArray = useRef(array);
  useEffect(() => {
    if (
      selection &&
      options?.presentation === 'panel' &&
      array?.[selection.index] !== selection.source
    ) {
      const moved = array?.indexOf(selection.source) ?? -1;
      if (moved >= 0) setSelection({ index: moved, source: selection.source });
      else if (
        array &&
        previousArray.current &&
        array.length === previousArray.current.length &&
        array.every(
          (value, index) =>
            index === selection.index ||
            value === previousArray.current?.[index]
        )
      ) {
        setSelection({
          index: selection.index,
          source: array[selection.index],
        });
      } else setSelection(undefined);
    }
    previousArray.current = array;
  }, [array, selection, options?.presentation]);
  const rowPath = selection
    ? [props.path, selection.index].filter((x) => x !== '').join('.')
    : '';
  const enabled =
    props.enabled !== false &&
    !props.readonly &&
    !(props.schema as any)?.readOnly;
  const conflict =
    !!selection &&
    options?.presentation === 'dialog' &&
    !isEqual(array?.[selection.index], selection.source);
  const open = (index: number) => {
    const draft =
      options?.presentation === 'dialog'
        ? { ...context.core!, data: cloneDeep(context.core?.data) }
        : undefined;
    draftRef.current = draft;
    setSelection({ index, source: array?.[index], draft });
  };
  const close = () => {
    pending.forEach((change) => change.cancel());
    setSelection(undefined);
    draftRef.current = undefined;
  };
  const dispatch = (action: any) => {
    if (
      !enabled ||
      !draftRef.current ||
      action.type !== UPDATE_DATA ||
      !(action.path === rowPath || action.path.startsWith(rowPath + '.'))
    )
      return;
    draftRef.current = coreReducer(draftRef.current, action);
    setSelection(
      (current) => current && { ...current, draft: draftRef.current }
    );
  };
  const detail = findUISchema(
    context.uischemas ?? [],
    props.schema,
    props.uischema.scope,
    rowPath,
    () =>
      Generate.uiSchema(
        props.schema,
        'VerticalLayout',
        undefined,
        props.rootSchema
      ),
    {
      ...props.uischema,
      options: { ...props.uischema.options, detail: options?.detail },
    },
    props.rootSchema
  );
  const form =
    selection && array && selection.index < array.length ? (
      <JsonFormsDispatch
        schema={props.schema}
        uischema={detail}
        path={rowPath}
        enabled={enabled}
        readonly={!enabled}
        renderers={props.renderers}
        cells={props.cells}
      />
    ) : null;
  return {
    options,
    panelOpen,
    setPanelOpen,
    open,
    close,
    selection,
    enabled,
    conflict,
    t,
    content: selection?.draft ? (
      <JsonFormsContext.Provider
        value={{ ...context, core: selection.draft, dispatch }}
      >
        <PendingChangesProvider changes={pending}>
          {form}
        </PendingChangesProvider>
      </JsonFormsContext.Provider>
    ) : (
      form
    ),
    apply: () => {
      if (!selection || !enabled || conflict || !draftRef.current) return;
      pending.forEach((change) => change.flush());
      const value = cloneDeep(Resolve.data(draftRef.current.data, rowPath));
      if (!isEqual(value, selection.source))
        context.dispatch?.(update(rowPath, () => value));
      close();
    },
  };
};
export type RowDetailState = ReturnType<typeof useRowDetail>;
