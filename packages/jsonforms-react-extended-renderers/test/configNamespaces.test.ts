import { describe, expect, test } from 'vitest';
import {
  JSONFORMS_CONFIG_KEY,
  JSONFORMS_EXTENDED_CONFIG_KEY,
  resolveExtendedOption,
} from '../src/util/configNamespaces';

describe('config namespaces', () => {
  test('exposes the wire spellings', () => {
    expect(JSONFORMS_EXTENDED_CONFIG_KEY).toBe('jsonformsExtended');
    expect(JSONFORMS_CONFIG_KEY).toBe('jsonforms-react-renderers');
  });
});

describe('resolveExtendedOption', () => {
  const config = { jsonformsExtended: { showValidationIndicator: true } };

  test('element option wins over the namespaced config default', () => {
    expect(
      resolveExtendedOption(
        { showValidationIndicator: false },
        config,
        'showValidationIndicator',
        true
      )
    ).toBe(false);
  });

  test('falls back to the namespaced config default', () => {
    expect(
      resolveExtendedOption({}, config, 'showValidationIndicator', false)
    ).toBe(true);
  });

  test('falls back to the supplied default when neither is set', () => {
    expect(
      resolveExtendedOption({}, {}, 'showValidationIndicator', false)
    ).toBe(false);
    expect(
      resolveExtendedOption(undefined, undefined, 'anything', 'fallback')
    ).toBe('fallback');
  });

  test('only undefined falls through: false, 0 and "" are real overrides', () => {
    expect(
      resolveExtendedOption(
        { v: false },
        { jsonformsExtended: { v: true } },
        'v',
        true
      )
    ).toBe(false);
    expect(
      resolveExtendedOption({ v: 0 }, { jsonformsExtended: { v: 9 } }, 'v', 9)
    ).toBe(0);
    expect(
      resolveExtendedOption(
        { v: '' },
        { jsonformsExtended: { v: 'x' } },
        'v',
        'x'
      )
    ).toBe('');
    expect(
      resolveExtendedOption({}, { jsonformsExtended: { v: false } }, 'v', true)
    ).toBe(false);
    expect(
      resolveExtendedOption(
        { v: undefined },
        { jsonformsExtended: { v: true } },
        'v',
        false
      )
    ).toBe(true);
  });

  test('ignores a flat config key, which is the wrong tier for an extension', () => {
    expect(
      resolveExtendedOption(
        {},
        { showValidationIndicator: true },
        'showValidationIndicator',
        false
      )
    ).toBe(false);
  });
});
