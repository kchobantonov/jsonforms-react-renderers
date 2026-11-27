import type { Translator } from '@jsonforms/core';

export type JsonInput = unknown;

export const parseJson = (value: JsonInput) => {
  if (typeof value !== 'string') return value;
  if (value.trim() === '') return undefined;
  return JSON.parse(value);
};

export const parseBoolean = (value: JsonInput) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === '' || value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return undefined;
};

export const parseMode = (value: JsonInput) =>
  value === 'dark' || value === 'light' || value === 'system'
    ? value
    : 'system';

export const createTranslator = (
  translations: JsonInput,
  locale = 'en',
): Translator => {
  if (typeof translations === 'function') return translations as Translator;
  const dictionary = parseJson(translations) as any;
  const own = (object: unknown, key: string): unknown =>
    object !== null &&
    typeof object === 'object' &&
    Object.prototype.hasOwnProperty.call(object, key)
      ? (object as Record<string, unknown>)[key]
      : undefined;
  const lookup = (catalog: unknown, id: string): string | undefined => {
    const exact = own(catalog, id);
    if (typeof exact === 'string') return exact;
    const nested = id
      .split('.')
      .reduce<unknown>((value, part) => own(value, part), catalog);
    if (typeof nested === 'string') return nested;
    // Compatibility with the wrapper's existing { key: { label: text } } catalogs.
    const label = own(exact, 'label');
    return typeof label === 'string' ? label : undefined;
  };
  const normalized = locale.toLowerCase().replaceAll('_', '-');
  return (id: string, defaultMessage: string | undefined) =>
    lookup(own(dictionary, locale), id) ??
    lookup(own(dictionary, normalized), id) ??
    lookup(own(dictionary, normalized.split('-')[0]), id) ??
    lookup(dictionary, id) ??
    defaultMessage ??
    id;
};
