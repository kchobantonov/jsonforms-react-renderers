import { displayableErrors } from './validationIndicator';
import React, { useState, useMemo } from 'react';
import {
  getI18nKey,
  defaultErrorTranslator,
  getCombinedErrorMessage,
  getControlPath,
  Resolve,
  toDataPathSegments,
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

export const useErrorSummary = (fallback: string, path?: string, active = true) => {
  const context = useJsonForms();
  const translate = useTranslator();
  const [primary, additional] = displayableErrors(context.core ?? {});
  const errors = path === undefined ? noErrors : indexedPathErrors(primary, additional).get(path) ?? noErrors;
  return useMemo(() => {
    if (!active || !fallback) return [];
    const entries = formatErrorSummary(errors, context.core?.schema, context.core?.uischema, translate, context.i18n?.translateError);
    return entries.length ? entries : fallback.split('\n').filter(Boolean).map(message => ({ path: '', message }));
  }, [active, fallback, errors, context.core?.schema, context.core?.uischema, translate, context.i18n?.translateError]);
};

/** Cheap count for choosing tooltip presentation; never translates individual errors. */
export const useErrorSummaryCount = (fallback: string, path?: string) => {
  const context = useJsonForms();
  if (!fallback) return 0;
  const errors = path === undefined ? undefined : indexedPathErrors(...displayableErrors(context.core ?? {})).get(path);
  return errors?.length || fallback.split('\n').filter(Boolean).length;
};

/** Header indicators need a short accessible summary, not every formatted descendant. */
export const usePathErrorIndicator = (path: string, options?: Record<string, any>, includeChildren = true) => {
  const context = useJsonForms();
  const t = useI18n();
  const translate = useTranslator();
  const errors = indexedPathErrors(...displayableErrors(context.core ?? {})).get(path) ?? noErrors;
  const own = useMemo(() => errors.filter(error => getControlPath(error) === path && error.keyword !== 'propertyNames' && (error as any).propertyName === undefined), [errors, path]);
  const children = errors.length - own.length;
  const showCount = options?.showValidationIndicatorCount ?? context.config?.showValidationIndicatorCount ?? false;
  const ownMessages = useMemo(() => formatErrorSummary(own, context.core?.schema, context.core?.uischema, translate, context.i18n?.translateError).map(entry => entry.message), [own, context.core?.schema, context.core?.uischema, translate, context.i18n?.translateError]);
  const messages = [...ownMessages];
  if (includeChildren && children) messages.push(t(showCount ? (children === 1 ? 'validation.childrenErrorCount' : 'validation.childrenErrorsCount') : 'validation.childrenErrors', { count: children }));
  return messages.join('\n');
};

const noErrors: import('ajv').ErrorObject[] = [];
const pathCache = new WeakMap<import('ajv').ErrorObject[], WeakMap<import('ajv').ErrorObject[], Map<string, import('ajv').ErrorObject[]>>>();
/** Share descendant lists across all cells for each validation result. */
export const indexedPathErrors = (primary = noErrors, additional = noErrors) => {
  let secondary = pathCache.get(primary);
  if (!secondary) { secondary = new WeakMap(); pathCache.set(primary, secondary); }
  let index = secondary.get(additional);
  if (!index) {
    index = new Map();
    for (const error of [...primary, ...additional]) {
      const path = getControlPath(error);
      const ancestors = [''];
      let prefix = '';
      for (const segment of path.split('.')) {
        if (!segment) continue;
        prefix = prefix ? prefix + '.' + segment : segment;
        ancestors.push(prefix);
      }
      for (const ancestor of ancestors) {
        const entries = index.get(ancestor) ?? [];
        entries.push(error);
        index.set(ancestor, entries);
      }
    }
    secondary.set(additional, index);
  }
  return index;
};

export const useCollectionErrors = (path: string) => {
  const context = useJsonForms();
  const index = indexedPathErrors(...displayableErrors(context.core ?? {}));
  const errors = index.get(path) ?? noErrors;
  const first = errors.map(error => getControlPath(error).slice(path ? path.length + 1 : 0).split('.')[0])
    .find(segment => /^\d+$/.test(segment));
  return { count: errors.length, firstIndex: first === undefined ? undefined : Number(first),
    rowCount: (row: number) => index.get(path ? path + '.' + row : String(row))?.length ?? 0 };
};

/** Only explicit detail controls can make Label summary errors actionable. */
export const labelDetailErrorPaths = (path: string, options: any): string[] | undefined => {
  if (options?.summary?.type !== 'Label') return undefined;
  const paths: string[] = [];
  const visit = (element: any) => {
    if (!element || typeof element !== 'object') return;
    if (element.type === 'Control' && typeof element.scope === 'string') {
      const relative = toDataPathSegments(element.scope).join('.');
      paths.push([path, relative].filter(Boolean).join('.'));
    }
    if (Array.isArray(element.elements)) element.elements.forEach(visit);
  };
  visit(options.detail);
  return paths;
};

/** Include errors on a composite value and all descendants, with core path semantics. */
export const usePathErrorMessages = (path: string, includedPaths?: string[]): string => {
  const context = useJsonForms();
  const translate = useTranslator();
  const index = indexedPathErrors(...displayableErrors(context.core ?? {}));
  const errors = includedPaths === undefined ? index.get(path) ?? noErrors
    : Array.from(new Set(includedPaths.flatMap(included => index.get(included) ?? noErrors)));
  return formatErrorSummary(
    errors, context.core?.schema, context.core?.uischema,
    translate, context.i18n?.translateError
  ).map((entry) => entry.path ? `${entry.path}: ${entry.message}` : entry.message).join('\n');
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

/** Object-owned group feedback; descendants keep their own validation messages. */
export const ObjectErrorContext = React.createContext<{ uischema: unknown; message: string } | undefined>(undefined);

/** Disallowed keys belong to the dynamic-property editor, including literal keys. */
export const useAdditionalPropertyErrors = (path: string) => {
  const context = useJsonForms();
  const translate = useTranslator();
  const [primary, additional] = displayableErrors(context.core ?? {});
  return useMemo(() => {
    const errors = [...(primary ?? []), ...(additional ?? [])].filter(error =>
      error.keyword === 'additionalProperties' &&
      error.instancePath.split('/').slice(1).map(segment => segment.replace(/~1/g, '/').replace(/~0/g, '~')).join('.') === path
    );
    return formatErrorSummary(errors, context.core?.schema, context.core?.uischema, translate, context.i18n?.translateError)
      .map((entry, index) => `${errors[index].params.additionalProperty}: ${entry.message}`).join('\n');
  }, [primary, additional, path, context.core?.schema, context.core?.uischema, translate, context.i18n?.translateError]);
};

export const usePropertyNameErrors = (path: string) => {
  const context = useJsonForms();
  const translate = useTranslator();
  const [primary, additional] = displayableErrors(context.core ?? {});
  return useMemo(() => {
    const result = new Map<string, string>();
    const errors = [...(primary ?? []), ...(additional ?? [])].filter(error =>
      ((error as any).propertyName !== undefined || error.keyword === 'propertyNames') &&
      error.instancePath.split('/').slice(1).map(segment => segment.replace(/~1/g, '/').replace(/~0/g, '~')).join('.') === path);
    const specificNames = new Set(errors.filter(error => error.keyword !== 'propertyNames').map(error => (error as any).propertyName));
    for (const error of errors) {
      const name = (error as any).propertyName ?? error.params.propertyName;
      if (error.keyword === 'propertyNames' && specificNames.has(name)) continue;
      const message = formatErrorSummary([error], context.core?.schema, context.core?.uischema, translate, context.i18n?.translateError)[0].message;
      result.set(name, [result.get(name), message].filter(Boolean).join('\n'));
    }
    return result;
  }, [primary, additional, path, context.core?.schema, context.core?.uischema, translate, context.i18n?.translateError]);
};

export const useNameConstraintMessage = () => {
  const context = useJsonForms();
  const translate = useTranslator();
  return (errors?: import('ajv').ErrorObject[]) => errors?.length
    ? formatErrorSummary(errors, undefined, undefined, translate, context.i18n?.translateError).map(entry => entry.message).join('\n')
    : undefined;
};
