import { ControlElement, Paths, Resolve, Translator } from '@jsonforms/core';
import { I18nKey } from './i18nDefaults';

/**
 * Summary of an object/array value, driven by the column's `summary` descriptor.
 * Arrays show up to two resolved previews plus a "+N more", or a plain count.
 */
export const compositeSummary = (
  data: unknown,
  summary: ControlElement | undefined,
  title: string | undefined,
  t: Translator,
  /*
    The locale-aware default for each key, from `useI18nDefault`.
    
    It is a parameter rather than a hook call because this is a plain
    function, and it cannot be `d(key)`: the default message is
    where the locale bundle is delivered (§6.5), so reading the English table
    here pinned every summary to English.
  */
  d: (key: I18nKey) => string
): string => {
  if (Array.isArray(data)) {
    if (summary?.scope && data.length) {
      const path = Paths.fromScoped(summary);
      const preview: string[] = [];
      for (const item of data) {
        const value = Resolve.data(item, path);
        if (
          value != null &&
          typeof value !== 'object' &&
          String(value).trim()
        ) {
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
        return preview.join(', ') + more;
      }
    }
    const key =
      data.length === 1 ? 'composite.summary.item' : 'composite.summary.items';
    return t(key, d(key), { count: data.length }).replace(
      '{count}',
      String(data.length)
    );
  }
  if (summary?.scope) {
    const value = Resolve.data(data, Paths.fromScoped(summary));
    if (value != null && typeof value !== 'object') return String(value);
  }
  if (data && typeof data === 'object')
    return (
      title ?? t('composite.summary.details', d('composite.summary.details'))
    );
  return t('composite.summary.unset', d('composite.summary.unset'));
};
