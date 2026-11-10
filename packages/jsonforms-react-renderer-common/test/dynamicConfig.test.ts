import { describe, expect, it } from 'vite-plus/test';
import {
  dynamicUiOptions,
  TRUST_DYNAMIC_FUNCTIONS,
} from '../src/dynamicConfig';

describe('dynamic activation and trust', () => {
  it.each([
    undefined,
    {},
    { dynamic: { enabled: true } },
    { jsonformsExtended: { dynamicValues: { enabled: true } } },
    { jsonformsExtended: { dynamic: { enabled: false } } },
    { jsonformsExtended: { dynamic: { enabled: 'true' } } },
  ])(
    'does not activate from unrelated flags or external alone: %j',
    (config) => {
      expect(dynamicUiOptions(config, { name: 'Ada' })).toBeUndefined();
    },
  );
  it.each([
    undefined,
    true,
    false,
    'TRUST_DYNAMIC_FUNCTIONS',
    Symbol('TRUST_DYNAMIC_FUNCTIONS'),
    Symbol.for('TRUST_DYNAMIC_FUNCTIONS'),
  ])('rejects non-capabilities: %s', (trusted) => {
    expect(
      dynamicUiOptions({
        jsonformsExtended: { dynamic: { enabled: true, trusted } },
      })?.trustedFunctions,
    ).toBe(false);
  });
  it('requires activation and preserves external identity', () => {
    const external = { name: 'Ada' };
    expect(
      dynamicUiOptions(
        {
          jsonformsExtended: { dynamic: { trusted: TRUST_DYNAMIC_FUNCTIONS } },
        },
        external,
      ),
    ).toBeUndefined();
    const options = dynamicUiOptions(
      {
        jsonformsExtended: {
          dynamic: { enabled: true, trusted: TRUST_DYNAMIC_FUNCTIONS },
        },
      },
      external,
    );
    expect(options?.trustedFunctions).toBe(true);
    expect(options?.external).toBe(external);
  });
});
