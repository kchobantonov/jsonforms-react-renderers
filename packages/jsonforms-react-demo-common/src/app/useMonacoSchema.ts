import { useEffect } from 'react';
import { useMonaco } from '@monaco-editor/react';
import { DATA_MODEL_PATH, parseEditorValue } from './editorValue';

/**
 * Teaches Monaco's JSON language service about the example's schema.
 *
 * Without it the Data editor only reports malformed JSON; with it, wrong
 * types, missing required properties and pattern or enum violations are marked
 * in the editor as you type - which is the same validation the form is doing,
 * shown where the text is being written.
 *
 * The schema is read from the **editor's text**, not from the example, so
 * editing the Schema tab re-teaches it. Mid-edit that text is usually not
 * valid JSON, which is not an error worth reporting: the previous schema stays
 * in force until the new one parses.
 */
export const useMonacoSchema = (schemaText: string): void => {
  const monaco = useMonaco();

  useEffect(() => {
    if (!monaco) {
      return;
    }
    let schema: unknown;
    try {
      schema = parseEditorValue(schemaText);
    } catch {
      return; // mid-edit; keep the last schema that parsed
    }
    if (!schema) {
      return;
    }
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      enableSchemaRequest: false,
      schemas: [
        {
          uri: 'inmemory://demo/schema.json',
          fileMatch: [DATA_MODEL_PATH],
          schema: schema as Record<string, unknown>,
        },
      ],
    });
  }, [monaco, schemaText]);
};
