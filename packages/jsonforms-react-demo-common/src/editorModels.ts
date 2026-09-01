export type EditorKey =
  | 'data'
  | 'schema'
  | 'uischema'
  | 'uischemas'
  | 'i18n'
  | 'config';

export type EditorModels = Record<EditorKey, string>;

export const stringifyEditorValue = (value: unknown) =>
  value === undefined ? '' : JSON.stringify(value, null, 2);

export const reloadOriginalEditorModel = (
  models: EditorModels,
  key: EditorKey,
  originalValue: unknown
): EditorModels => ({
  ...models,
  [key]: stringifyEditorValue(originalValue),
});
