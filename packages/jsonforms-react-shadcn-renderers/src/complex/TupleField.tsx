import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import { Pencil } from 'lucide-react';
import {
  ControlElement,
  JsonSchema,
  Paths,
  UPDATE_DATA,
  UISchemaElement,
  getI18nKey,
  update,
} from '@jsonforms/core';
import {
  JsonFormsContext,
  JsonFormsDispatch,
  useJsonForms,
} from '@jsonforms/react';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import set from 'lodash/set';
import unset from 'lodash/unset';
import { compositeSummary } from '@chobantonov/jsonforms-react-renderer-common/compositeSummary';
import {
  useI18n,
  useI18nDefault,
  useTranslator,
} from '@chobantonov/jsonforms-react-renderer-common/translate';
import {
  TupleSchema,
  isComplexTupleSchema,
  tupleEmptyValue,
  tupleFieldOwnsLabel,
  tupleInitialValue,
  tupleRenderSchema,
} from '@chobantonov/jsonforms-react-renderer-common/tuple';
import {
  CompositeDetailDialog,
  CompositeDetailDialogOptions,
} from '../cells/CompositeDetailDialog';

export interface TupleFieldProps {
  schema: TupleSchema;

  prefix: TupleSchema[];
  index: number;
  arrayPath: string;
  rootSchema: JsonSchema;
  uischema: UISchemaElement;
  enabled: boolean;
  options: Record<string, any>;
}

export const TupleField = ({
  schema,
  prefix,
  index,
  arrayPath,
  rootSchema,
  uischema,
  enabled,
  options,
}: TupleFieldProps) => {
  const t = useI18n();
  // The dialog and the summary helper are shared with the table cells, which
  // receive a `Translator` as a prop, so they take one rather than the hook.
  const translator = useTranslator();
  const i18nDefault = useI18nDefault();
  const context = useJsonForms();
  const [open, setOpen] = useState(false);

  const [message, setMessage] = useState<string | undefined>();

  const path = Paths.compose(arrayPath, String(index));
  const array = arrayPath
    ? get(context.core?.data, arrayPath.split('.'))
    : context.core?.data;
  const data: unknown[] = Array.isArray(array) ? array : [];
  const value = data[index];

  const renderSchema = tupleRenderSchema(schema);
  const complex = isComplexTupleSchema(schema);
  const ownsLabel = tupleFieldOwnsLabel(schema);

  const label =
    translator(
      getI18nKey(renderSchema, uischema, path, 'label'),
      String((uischema as { label?: unknown }).label ?? '')
    ) ?? String((uischema as { label?: unknown }).label ?? '');

  const parentDispatch = context.dispatch;
  const intercept = useCallback(
    (action: any) => {
      const inside =
        action?.type === UPDATE_DATA &&
        (action.path === path || action.path?.startsWith(`${path}.`));
      if (!inside) {
        parentDispatch?.(action);
        return;
      }
      if (!enabled) {
        return;
      }
      const source = cloneDeep(data);
      // '' for a write to the position itself, otherwise the path within it.
      const relative =
        action.path === path ? '' : action.path.slice(path.length + 1);
      let next = action.updater(
        cloneDeep(
          relative ? get(source[index], relative.split('.')) : source[index]
        )
      );

      if (!relative && next === undefined) {
        // Clearing. A string keeps `""`, an object `{}`; a number has no empty
        // value, so the edit is held rather than turned into a zero.
        next = tupleEmptyValue(schema, rootSchema);
        if (next === undefined) {
          setMessage(t('tuple.valueRequired'));
          return;
        }
      }

      // Fill the gap between the end of the array and this position, so the
      // prefix and the edit commit together.
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
            // A numeric first segment means the child is writing into an array.
            (/^\d+(\.|$)/.test(relative) ? [] : {});
        }
        const segments = relative.split('.');
        if (next === undefined) {
          unset(source[index], segments);
        } else {
          set(source[index] as object, segments, next);
        }
      } else {
        source[index] = next;
      }

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
    ]
  );

  const scoped = useMemo(
    () => ({ ...context, dispatch: intercept }),
    [context, intercept]
  );

  const dialogOptions = {
    ...options,
    ...(uischema.options ?? {}),
  } as CompositeDetailDialogOptions;

  const detail: UISchemaElement =
    (uischema.options?.detail as UISchemaElement | undefined) ?? uischema;

  const body = () => {
    if (schema === false) {
      return (
        <span className='text-destructive' role='alert'>
          {t('tuple.forbidden')}
        </span>
      );
    }
    if (complex) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
            {compositeSummary(
              value,
              uischema.options?.summary as ControlElement | undefined,
              renderSchema.title,
              translator,
              i18nDefault
            )}
          </span>
          <Button
            size='icon-sm'
            type='button'
            variant='ghost'
            disabled={!enabled}
            onClick={() => setOpen(true)}
            title={t('composite.edit', { label })}
            aria-label={t('composite.edit', { label })}
          >
            <Pencil className='h-4 w-4' />
          </Button>
          <CompositeDetailDialog
            open={open}
            title={renderSchema.title ?? label}
            label={label}
            path={path}
            schema={renderSchema}
            enabled={enabled}
            options={dialogOptions}
            t={translator}
            onClose={() => setOpen(false)}
            onApply={(applied) =>
              intercept({
                type: UPDATE_DATA,
                path,
                updater: () => applied,
              })
            }
          >
            <JsonFormsDispatch
              schema={renderSchema}
              uischema={detail}
              path={path}
              enabled={enabled}
            />
          </CompositeDetailDialog>
        </div>
      );
    }
    return (
      <JsonFormsDispatch
        schema={renderSchema}
        // The label is drawn by the fieldset legend when this position owns it,
        // so the delegated control must not draw it again.
        uischema={
          ownsLabel
            ? ({ ...uischema, label: false } as ControlElement)
            : uischema
        }
        path={path}
        enabled={enabled}
      />
    );
  };

  return (
    <JsonFormsContext.Provider value={scoped}>
      <fieldset
        data-tuple-field={index}
        style={{ border: 0, padding: 0, margin: 0, minWidth: 0, flex: '1 1 0' }}
      >
        {ownsLabel && (
          <legend
            style={{
              display: 'block',
              width: '100%',
              marginBottom: 4,
              fontSize: 14,
              color: 'inherit',
            }}
          >
            {label}
          </legend>
        )}
        {body()}
        {message && (
          <span className='text-destructive' role='alert' data-tuple-draft>
            {message}
          </span>
        )}
      </fieldset>
    </JsonFormsContext.Provider>
  );
};
