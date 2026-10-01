import {
  ControlElement,
  JsonSchema,
  Paths,
  Resolve,
  Translator,
  createCleanLabel,
  getI18nKey,
} from '@jsonforms/core';
import { I18nKey } from './i18nDefaults';

export interface CompositeSummary {
  text: string;
  /** Generated descriptions use secondary, italic typography instead of data styling. */
  generated: boolean;
}

export const compositeSummaryPresentation = (
  data: unknown,
  summary: ControlElement | undefined,
  title: string | undefined,
  t: Translator,
  d: (key: I18nKey) => string,
  schema?: JsonSchema
): CompositeSummary => {
  const generated = (text: string): CompositeSummary => ({
    text,
    generated: true,
  });
  const literal = (text: string): CompositeSummary => ({
    text,
    generated: false,
  });
  const usable = (value: unknown) =>
    value != null && typeof value !== 'object' && String(value).trim() !== '';
  if (data == null)
    return generated(
      t('composite.summary.unset', d('composite.summary.unset'))
    );
  if (Array.isArray(data)) {
    if (summary?.scope && data.length) {
      const path = Paths.fromScoped(summary);
      const preview: string[] = [];
      for (const item of data) {
        const value = Resolve.data(item, path);
        if (usable(value)) {
          preview.push(String(value));
          if (preview.length === 2) break;
        }
      }
      if (preview.length) {
        const remaining = data.length - preview.length;
        const more = remaining
          ? ' ' +
            t('composite.summary.more', d('composite.summary.more'), {
              count: remaining,
            }).replace('{count}', String(remaining))
          : '';
        return literal(preview.join(', ') + more);
      }
    }
    const key =
      data.length === 1 ? 'composite.summary.item' : 'composite.summary.items';
    return generated(
      t(key, d(key), { count: data.length }).replace(
        '{count}',
        String(data.length)
      )
    );
  }
  if (typeof data === 'object') {
    if (Object.keys(data).length === 0)
      return generated(
        t('composite.summary.emptyObject', d('composite.summary.emptyObject'))
      );
    if (summary?.scope) {
      const path = Paths.fromScoped(summary);
      const value = Resolve.data(data, path);
      if (usable(value)) return literal(String(value));
      const fieldSchema = schema
        ? Resolve.schema(schema, summary.scope, schema)
        : undefined;
      const fallback =
        typeof summary.label === 'string'
          ? summary.label
          : fieldSchema?.title ??
            (path ? createCleanLabel(path.split('.').pop()!) : title);
      if (fallback) {
        const label = t(
          getI18nKey(fieldSchema, summary, path, 'label'),
          fallback
        );
        return generated(
          t(
            'composite.summary.unspecified',
            d('composite.summary.unspecified'),
            { label }
          ).replace('{label}', label)
        );
      }
    }
    return generated(
      title ?? t('composite.summary.details', d('composite.summary.details'))
    );
  }
  return literal(String(data));
};

/** Text-only compatibility API. Renderers use the presentation API to distinguish fallback labels. */
export const compositeSummary = (
  ...args: Parameters<typeof compositeSummaryPresentation>
): string => compositeSummaryPresentation(...args).text;
