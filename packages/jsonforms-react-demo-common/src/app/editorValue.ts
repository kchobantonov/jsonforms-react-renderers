/** The Monaco model path the Data editor uses, so its model is reused. */
export const DATA_MODEL_PATH = 'demo-data.json';

/**
 * What an editor's text means.
 *
 * Empty is `undefined` rather than a parse error: clearing an editor is a
 * reasonable thing to do, and it means "no value" rather than "invalid JSON".
 */
export const parseEditorValue = (value: string) =>
  value.trim() === '' ? undefined : JSON.parse(value);
