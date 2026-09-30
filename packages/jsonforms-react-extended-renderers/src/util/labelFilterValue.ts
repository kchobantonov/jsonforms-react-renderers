import { buildNamespaceScope, buildTextScope, dynamicValuesEnabled, splitTemplate } from './interpolate';
import { renderTemplate, resolveTextParams } from './celTemplate';
import { resolveMarkup } from './markup';

/** Resolve the authored Label text without exposing data beyond the Label's own gates. */
export const labelFilterValue = (
  label: any, data: unknown, item: unknown, config: unknown,
  locale?: string, translate?: (key: string, fallback?: string) => string | undefined
): string => {
  const text = label.i18n ? translate?.(label.i18n + '.text', label.text ?? '') ?? label.text ?? '' : label.text ?? '';
  if (!resolveMarkup(label.options, config).interpolate) return text;
  const params = resolveTextParams(label.options?.textParams, buildNamespaceScope({
    data, item, config, locale, dynamicAllowed: dynamicValuesEnabled(config),
  }), locale, translate);
  return renderTemplate(splitTemplate(text), buildTextScope(params.params, locale), undefined, locale, translate).text;
};
