import {
  and,
  isStringControl,
  optionIs,
  or,
  rankWith,
  schemaTypeIs,
  uiTypeIs,
  Tester,
  Resolve,
} from '@jsonforms/core';
const hasLanguage: Tester = (ui) =>
  typeof ui.options?.language === 'string' ||
  typeof ui.options?.[':language'] === 'string';
export const monacoControlTester = rankWith(
  25,
  and(
    uiTypeIs('Control'),
    optionIs('format', 'code'),
    or(
      and(isStringControl, hasLanguage),
      and(optionIs('language', 'json'), optionIs('convertJson', true))
    )
  )
);
export const extendedAgGridTester = rankWith(
  25,
  and(
    uiTypeIs('Control'),
    schemaTypeIs('array'),
    optionIs('variant', 'ag-grid')
  )
);
export const resolveEditorLanguage = (
  options: Record<string, any>,
  data: unknown
): string => {
  const language =
    typeof options[':language'] === 'string'
      ? Resolve.data(data, options[':language'])
      : undefined;
  return typeof language === 'string' && language
    ? language
    : options.language || 'plaintext';
};
export const encodeEditorValue = (data: unknown, convert: boolean) =>
  data == null ? '' : convert ? JSON.stringify(data, null, 2) : String(data);
export const decodeEditorValue = (
  value: string,
  convert: boolean
): { valid: boolean; value: unknown } => {
  if (!convert) return { valid: true, value: value || undefined };
  try {
    return { valid: true, value: JSON.parse(value) };
  } catch {
    return { valid: false, value };
  }
};
