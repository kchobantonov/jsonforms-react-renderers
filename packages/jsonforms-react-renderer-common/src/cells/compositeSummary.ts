import {
  ControlElement,
  JsonSchema,
  Paths,
  Resolve,
  Translator,
  createCleanLabel,
  getI18nKey,
} from '@jsonforms/core';
import { I18nKey } from '../locale';

export interface CompositeSummary {
  text: string;
  /** Generated descriptions use secondary, italic typography instead of data styling. */
  generated: boolean;
}

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
function arrayPreview(data: unknown[], summary: ControlElement): string[] {
  const path = Paths.fromScoped(summary);
  const preview: string[] = [];
  for (const item of data) {
    const value = Resolve.data(item, path);
    if (usable(value)) {
      preview.push(String(value));
      if (preview.length === 2) break;
    }
  }
  return preview;
}

function arraySummary(
  data: unknown[],
  summary: ControlElement | undefined,
  t: Translator,
  defaultMessage: (key: I18nKey) => string,
): CompositeSummary {
  const preview = summary?.scope ? arrayPreview(data, summary) : [];
  if (preview.length) {
    const remaining = data.length - preview.length;
    const more = remaining
      ? ' ' +
        t('composite.summary.more', defaultMessage('composite.summary.more'), {
          count: remaining,
        }).replace('{count}', String(remaining))
      : '';
    return literal(preview.join(', ') + more);
  }
  const key =
    data.length === 1 ? 'composite.summary.item' : 'composite.summary.items';
  return generated(
    t(key, defaultMessage(key), { count: data.length }).replace(
      '{count}',
      String(data.length),
    ),
  );
}

function summaryFieldLabel(
  summary: ControlElement,
  path: string,
  schema: JsonSchema | undefined,
  title: string | undefined,
  t: Translator,
) {
  const fieldSchema = schema
    ? Resolve.schema(schema, summary.scope, schema)
    : undefined;
  const fallback =
    typeof summary.label === 'string'
      ? summary.label
      : (fieldSchema?.title ??
        (path ? createCleanLabel(path.split('.').pop()!) : title));
  return fallback
    ? t(getI18nKey(fieldSchema, summary, path, 'label'), fallback)
    : undefined;
}

function objectSummary(
  data: object,
  summary: ControlElement | undefined,
  title: string | undefined,
  t: Translator,
  defaultMessage: (key: I18nKey) => string,
  schema?: JsonSchema,
): CompositeSummary {
  if (Object.keys(data).length === 0)
    return generated(
      t(
        'composite.summary.emptyObject',
        defaultMessage('composite.summary.emptyObject'),
      ),
    );
  if (summary?.scope) {
    const path = Paths.fromScoped(summary);
    const value = Resolve.data(data, path);
    if (usable(value)) return literal(String(value));
    const label = summaryFieldLabel(summary, path, schema, title, t);
    if (label !== undefined) {
      return generated(
        t(
          'composite.summary.unspecified',
          defaultMessage('composite.summary.unspecified'),
          { label },
        ).replace('{label}', label),
      );
    }
  }
  return generated(
    title ??
      t(
        'composite.summary.details',
        defaultMessage('composite.summary.details'),
      ),
  );
}

export const compositeSummaryPresentation = (
  data: unknown,
  summary: ControlElement | undefined,
  title: string | undefined,
  t: Translator,
  defaultMessage: (key: I18nKey) => string,
  schema?: JsonSchema,
): CompositeSummary => {
  if (data == null)
    return generated(
      t('composite.summary.unset', defaultMessage('composite.summary.unset')),
    );
  if (Array.isArray(data))
    return arraySummary(data, summary, t, defaultMessage);
  if (typeof data === 'object')
    return objectSummary(data, summary, title, t, defaultMessage, schema);
  return literal(String(data));
};

/** Text-only compatibility API. Renderers use the presentation API to distinguish fallback labels. */
export const compositeSummary = (
  ...args: Parameters<typeof compositeSummaryPresentation>
): string => compositeSummaryPresentation(...args).text;
