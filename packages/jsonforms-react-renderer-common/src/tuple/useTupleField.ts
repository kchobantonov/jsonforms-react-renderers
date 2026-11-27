import { useCallback, useMemo, useState } from 'react';
import {
  Paths,
  UPDATE_DATA,
  getI18nKey,
  update,
  type JsonSchema,
  type UISchemaElement,
} from '@jsonforms/core';
import { useJsonForms } from '@jsonforms/react';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import set from 'lodash/set';
import unset from 'lodash/unset';
import { resolveEditorDetail } from '../core/detailUiSchema';
import { useI18n, useI18nDefault, useTranslator } from '../locale/translate';
import {
  isComplexTupleSchema,
  tupleEmptyValue,
  tupleFieldOwnsLabel,
  tupleInitialValue,
  tupleRenderSchema,
  type TupleSchema,
} from './tupleSchema';

export interface TupleFieldBehaviorProps {
  schema: TupleSchema;
  prefix: TupleSchema[];
  index: number;
  arrayPath: string;
  rootSchema: JsonSchema;
  uischema: UISchemaElement;
  enabled: boolean;
}

/** Intercepts positional writes so missing tuple positions never become sparse array holes. */
export const useTupleField = ({
  schema,
  prefix,
  index,
  arrayPath,
  rootSchema,
  uischema,
  enabled,
}: TupleFieldBehaviorProps) => {
  const t = useI18n();
  const translator = useTranslator();
  const i18nDefault = useI18nDefault();
  const context = useJsonForms();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const path = Paths.compose(arrayPath, String(index));
  const array = arrayPath
    ? get(context.core?.data, arrayPath.split('.'))
    : context.core?.data;
  const data: unknown[] = useMemo(
    () => (Array.isArray(array) ? array : []),
    [array],
  );
  const value = data[index];
  const renderSchema = tupleRenderSchema(schema);
  const complex = isComplexTupleSchema(schema);
  const ownsLabel = tupleFieldOwnsLabel(schema);
  const fallbackLabel = String((uischema as { label?: unknown }).label ?? '');
  const label =
    translator(
      getI18nKey(renderSchema, uischema, path, 'label'),
      fallbackLabel,
    ) ?? fallbackLabel;
  const parentDispatch = context.dispatch;

  /* eslint-disable react/preserve-manual-memoization -- The updater only mutates a deep-cloned tuple; lodash cloneDeep aliasing is opaque to the compiler. */
  const intercept = useCallback(
    (action: any) => {
      const inside =
        action?.type === UPDATE_DATA &&
        (action.path === path || action.path?.startsWith(`${path}.`));
      if (!inside) {
        parentDispatch?.(action);
        return;
      }
      if (!enabled) return;
      const source = [...cloneDeep(data)];
      const relative =
        action.path === path ? '' : action.path.slice(path.length + 1);
      let next = action.updater(
        cloneDeep(
          relative ? get(source[index], relative.split('.')) : source[index],
        ),
      );
      if (!relative && next === undefined) {
        next = tupleEmptyValue(schema, rootSchema);
        if (next === undefined) {
          setMessage(t('tuple.valueRequired'));
          return;
        }
      }
      for (let position = source.length; position < index; position += 1) {
        const initial = tupleInitialValue(prefix[position] ?? true, rootSchema);
        if (initial === undefined) {
          setMessage(t('tuple.missingPosition', { position: position + 1 }));
          return;
        }
        source.push(initial);
      }
      if (relative) {
        if (source[index] === undefined) {
          source[index] =
            tupleInitialValue(schema, rootSchema) ??
            (/^\d+(\.|$)/.test(relative) ? [] : {});
        }
        const segments = relative.split('.');
        if (next === undefined) unset(source[index], segments);
        else set(source[index] as object, segments, next);
      } else source[index] = next;
      setMessage(undefined);
      parentDispatch?.(update(arrayPath, () => source));
    },
    [
      arrayPath,
      data,
      enabled,
      index,
      parentDispatch,
      path,
      prefix,
      rootSchema,
      schema,
      t,
    ],
  );
  /* eslint-enable react/preserve-manual-memoization */

  const scoped = useMemo(
    () => ({ ...context, dispatch: intercept }),
    [context, intercept],
  );
  const detail = resolveEditorDetail(
    uischema.options?.detail,
    context.uischemas ?? [],
    renderSchema,
    '#',
    path,
    rootSchema,
    { ...uischema, options: { ...uischema.options, detail: undefined } },
  );
  return {
    t,
    translator,
    i18nDefault,
    open,
    setOpen,
    message,
    path,
    value,
    renderSchema,
    complex,
    ownsLabel,
    label,
    intercept,
    scoped,
    detail,
  };
};
