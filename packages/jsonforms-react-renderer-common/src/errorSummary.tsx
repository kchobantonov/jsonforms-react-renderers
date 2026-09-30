import { displayableErrors } from './validationIndicator';
import React, { useState } from 'react';
import {
  getI18nKey,
  defaultErrorTranslator,
  getCombinedErrorMessage,
  getControlPath,
  Resolve,
} from '@jsonforms/core';
import { useJsonForms } from '@jsonforms/react';
import { useI18n, useTranslator } from './translate';

export interface ErrorSummaryEntry {
  path: string;
  message: string;
}

/** Translate structured errors without losing their paths or message boundaries. */
export const formatErrorSummary = (
  errors: import('ajv').ErrorObject[],
  rootSchema: import('@jsonforms/core').JsonSchema | undefined,
  rootUiSchema: import('@jsonforms/core').UISchemaElement | undefined,
  translate: import('@jsonforms/core').Translator,
  translateError = defaultErrorTranslator
): ErrorSummaryEntry[] => {
  const findControl = (node: any, scope: string): any => {
    if (node?.type === 'Control' && node.scope === scope) return node;
    for (const child of node?.elements ?? []) {
      const found = findControl(child, scope);
      if (found) return found;
    }
    return undefined;
  };
  return errors.map((error) => {
    const path = getControlPath(error);
    // Walk data segments, preserving one-based row numbers in the label.
    let schema: any = rootSchema;
    let scope = '#';
    let prefix = '';
    const labels: string[] = [];
    for (const segment of path.split('.').filter(Boolean)) {
      if (schema?.$ref && rootSchema)
        schema = Resolve.schema(rootSchema, schema.$ref, rootSchema);
      prefix = prefix ? prefix + '.' + segment : segment;
      if (schema?.type === 'array' && /^\d+$/.test(segment)) {
        schema = Array.isArray(schema.items)
          ? schema.items[Number(segment)]
          : schema.items;
        scope += '/items';
        labels.push(String(Number(segment) + 1));
      } else {
        schema = schema?.properties?.[segment] ?? schema?.additionalProperties;
        scope +=
          '/properties/' + segment.replace(/~/g, '~0').replace(/\//g, '~1');
        const control = findControl(rootUiSchema, scope);
        const fallbackLabel =
          typeof control?.label === 'string'
            ? control.label
            : schema?.title ?? segment;
        labels.push(
          translate(
            getI18nKey(schema, control, prefix, 'label'),
            fallbackLabel
          ) ?? fallbackLabel
        );
      }
    }
    const control = findControl(rootUiSchema, scope);
    const message = getCombinedErrorMessage(
      [error],
      translateError,
      translate,
      schema,
      control,
      path
    );
    return { path: labels.join(' / '), message };
  });
};

export const useErrorSummary = (fallback: string, path?: string) => {
  const context = useJsonForms();
  const translate = useTranslator();
  if (!fallback) return [];
  const errors = displayableErrors(context.core ?? {})
    .flatMap((list) => list ?? [])
    .filter((error) => {
      const errorPath = getControlPath(error);
      return (
        path !== undefined &&
        (errorPath === path || path === '' || errorPath.startsWith(path + '.'))
      );
    });
  const entries = formatErrorSummary(
    errors,
    context.core?.schema,
    context.core?.uischema,
    translate,
    context.i18n?.translateError
  );
  return entries.length
    ? entries
    : fallback
        .split('\n')
        .filter(Boolean)
        .map((message) => ({ path: '', message }));
};

/** Shared presentation structure; the renderer supplies its native action component. */
export const ErrorSummaryList = ({
  entries,
  renderToggle,
}: {
  entries: ErrorSummaryEntry[];
  renderToggle: (
    label: string,
    toggle: () => void,
    expanded: boolean
  ) => React.ReactNode;
}) => {
  const [expanded, setExpanded] = useState(false);
  const t = useI18n();
  const limit = 3;
  return (
    <div style={{ maxWidth: 'min(28rem, 80vw)' }}>
      <strong>
        {t(
          entries.length === 1
            ? 'validation.containerError'
            : 'validation.containerErrors',
          { count: entries.length }
        )}
      </strong>
      <ul
        style={{
          margin: '8px 0',
          paddingInlineStart: 20,
          maxHeight: 'min(20rem, 50vh)',
          overflowY: 'auto',
          overflowWrap: 'anywhere',
        }}
      >
        {(expanded ? entries : entries.slice(0, limit)).map((entry, index) => (
          <li key={index} style={{ marginBlock: 4 }}>
            {entry.path && <strong>{entry.path}: </strong>}
            {entry.message}
          </li>
        ))}
      </ul>
      {entries.length > limit &&
        renderToggle(
          t(expanded ? 'validation.showLess' : 'validation.showMore', {
            count: entries.length - limit,
          }),
          () => setExpanded(!expanded),
          expanded
        )}
    </div>
  );
};
