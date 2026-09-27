import React, { useCallback, useMemo, useState } from 'react';
import { Button, Typography, theme as antTheme } from 'antd';
import EditOutlined from '@ant-design/icons/EditOutlined';
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
import { compositeSummary } from '../util/compositeSummary';
import { useI18n, useI18nDefault, useTranslator } from '../util/translate';
import {
  TupleSchema,
  isComplexTupleSchema,
  tupleEmptyValue,
  tupleFieldOwnsLabel,
  tupleInitialValue,
  tupleRenderSchema,
} from '../util/tuple';
import {
  CompositeDetailDialog,
  CompositeDetailDialogOptions,
} from '../cells/CompositeDetailDialog';

export interface TupleFieldProps {
  schema: TupleSchema;
  /** Every declared position, needed to initialize the ones before this one. */
  prefix: TupleSchema[];
  index: number;
  arrayPath: string;
  rootSchema: JsonSchema;
  uischema: UISchemaElement;
  enabled: boolean;
  options: Record<string, any>;
}

/**
 * One declared position of a tuple.
 *
 * The reason this is a component rather than a bare `JsonFormsDispatch` is the
 * **write contract**. A delegated control at `order.2` would dispatch an update
 * for that path, and writing index 2 of a one-element array produces a hole -
 * `["a", undefined, value]` - which section 18 forbids outright: "without
 * creating sparse arrays or relying on undefined-to-null JSON serialization".
 *
 * So the position hands its children a `dispatch` of its own. Anything writing
 * inside this position is caught, the array is rebuilt whole - preceding gaps
 * filled from each position's schema, the edit applied - and committed as one
 * update to the array. Anything else is passed straight through, so a control
 * elsewhere in the form is unaffected.
 *
 * Replacing `dispatch` through context is the same technique
 * `CompositeDetailDialog` uses to keep its draft private, and it works for the
 * same reason: every JSON Forms control writes through the context's dispatch
 * rather than through a prop it could be given directly.
 */
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
  const { token } = antTheme.useToken();
  const t = useI18n();
  // The dialog and the summary helper are shared with the table cells, which
  // receive a `Translator` as a prop, so they take one rather than the hook.
  const translator = useTranslator();
  const i18nDefault = useI18nDefault();
  const context = useJsonForms();
  const [open, setOpen] = useState(false);
  /**
   * An edit that is being held rather than committed, because committing it
   * would mean inventing a value the schema does not describe. Section 18: keep
   * it as a local draft and "identify the position needing input rather than
   * inventing a type or null value".
   */
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

  /*
    Section 18's precedence, which core already implements in `getI18nKey`: the
    delegated element's own `i18n`, then the positional schema's `i18n`, then
    the path-derived prefix. The readable label is the fallback.

    Core's path-derived prefix strips array indices, so two positions of the
    same tuple resolve to the *same* key - which is why the specification tells
    authors to put an explicit `i18n` on each positional schema when the
    positions need distinct labels, and why this must not be worked around by
    inventing an index-bearing key here.
  */
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

  /*
    A registry entry may be a position Control carrying `summary` and `detail`,
    or a plain layout that is itself the dialog's form. Both are supported by
    the specification, so `detail` is used when present and the element itself
    otherwise.
  */
  const detail: UISchemaElement =
    (uischema.options?.detail as UISchemaElement | undefined) ?? uischema;

  const body = () => {
    if (schema === false) {
      return (
        <Typography.Text type='danger' role='alert'>
          {t('tuple.forbidden')}
        </Typography.Text>
      );
    }
    if (complex) {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: token.paddingXS,
          }}
        >
          {/*
            Selectable text, and only the Edit button opens the dialog - the
            specification is explicit on both. Showing a summary must not create
            or normalize the value, so nothing is written here.
          */}
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
            size='small'
            type='text'
            icon={<EditOutlined />}
            disabled={!enabled}
            onClick={() => setOpen(true)}
            title={t('composite.edit', { label })}
            aria-label={t('composite.edit', { label })}
          />
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
            /*
              Apply writes through the same interception as a direct edit, so a
              dialog on a position past the end of the array fills the prefix
              too rather than punching a hole in it.
            */
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
              marginBottom: token.paddingXXS,
              fontSize: token.fontSize,
              color: token.colorTextHeading,
            }}
          >
            {label}
          </legend>
        )}
        {body()}
        {message && (
          <Typography.Text type='warning' role='alert' data-tuple-draft>
            {message}
          </Typography.Text>
        )}
      </fieldset>
    </JsonFormsContext.Provider>
  );
};
