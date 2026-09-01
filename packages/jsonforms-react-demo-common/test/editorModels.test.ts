import { describe, expect, it } from 'vitest';
import { EditorModels, reloadOriginalEditorModel } from '../src/editorModels';

const models: EditorModels = {
  data: '{"edited":true}',
  schema: '{"type":"object"}',
  uischema: '',
  uischemas: '',
  i18n: '',
  config: '',
};

describe('reloadOriginalEditorModel', () => {
  it('restores the selected example value instead of the edited model', () => {
    const reloaded = reloadOriginalEditorModel(models, 'data', {
      original: true,
    });

    expect(reloaded.data).toBe('{\n  "original": true\n}');
    expect(reloaded.schema).toBe(models.schema);
  });

  it('does not mutate the current editor models', () => {
    reloadOriginalEditorModel(models, 'data', { original: true });

    expect(models.data).toBe('{"edited":true}');
  });
});
