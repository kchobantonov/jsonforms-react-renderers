import {
  buildNamespaceScope,
  buildTextScope,
  dynamicValuesEnabled,
  splitTemplate,
} from './interpolate';
import { renderTemplate, resolveTextParams } from './celTemplate';
import { markdownPlainText } from './markdown';
import { escapeMarkdown } from './markdownEscape';
import { markdownProfile, resolveMarkup } from './markup';

/** Resolve the authored Label text without exposing data beyond the Label's own gates. */
export const labelFilterValue = (
  label: any,
  data: unknown,
  item: unknown,
  config: unknown,
  locale?: string,
  translate?: (key: string, fallback?: string) => string | undefined
): string => {
  const text = label.i18n
    ? translate?.(label.i18n + '.text', label.text ?? '') ?? label.text ?? ''
    : label.text ?? '';
  const markup = resolveMarkup(label.options, config);
  const plain = (value: string) =>
    markup.markdown ? markdownPlainText(value, markdownProfile(config)) : value;
  if (!markup.interpolate) return plain(text);
  const params = resolveTextParams(
    label.options?.textParams,
    buildNamespaceScope({
      data,
      item,
      config,
      locale,
      dynamicAllowed: dynamicValuesEnabled(config),
    }),
    locale,
    translate
  );
  return plain(
    renderTemplate(
      splitTemplate(text),
      buildTextScope(params.params, locale),
      markup.markdown ? escapeMarkdown : undefined,
      locale,
      translate
    ).text
  );
};
