import {
  agGridArrayTester,
  colorControlTester,
  createShadcnExtendedRenderers,
  durationControlTester,
  fileControlTester,
  formatDurationIso,
  normalizeColor,
  nullControlTester,
  parseDuration,
  splitLayoutTester,
} from '../src';

const rank = (tester: any, uischema: any, schema: any) =>
  tester(uischema, schema, undefined);

describe('Shadcn extended renderer registry', () => {
  test('includes the extended and shared presentation renderers', () => {
    expect(createShadcnExtendedRenderers()).toHaveLength(16);
  });

  test('selects each specialized renderer only for its contract', () => {
    expect(
      rank(
        colorControlTester,
        { type: 'Control', scope: '#/properties/value' },
        { type: 'string', format: 'color' }
      )
    ).toBe(2);
    expect(
      rank(
        durationControlTester,
        { type: 'Control', scope: '#/properties/value' },
        { type: 'string', format: 'duration' }
      )
    ).toBe(2);
    expect(
      rank(
        fileControlTester,
        { type: 'Control', scope: '#' },
        { type: 'string', contentEncoding: 'base64' }
      )
    ).toBe(2);
    expect(
      rank(
        fileControlTester,
        { type: 'Control', scope: '#' },
        { type: 'string' }
      )
    ).toBe(-1);
    expect(
      rank(nullControlTester, { type: 'Control', scope: '#' }, { type: 'null' })
    ).toBe(2);
    expect(
      rank(
        splitLayoutTester,
        { type: 'HorizontalLayout', options: { variant: 'splitter' } },
        {}
      )
    ).toBe(5);
    expect(
      rank(
        agGridArrayTester,
        { type: 'Control', scope: '#', options: { variant: 'ag-grid' } },
        { type: 'array' }
      )
    ).toBe(25);
  });
});

describe('extended value helpers', () => {
  test('round-trips ISO 8601 durations', () => {
    const parts = parseDuration('P1Y2M3DT4H5M6S');
    expect(parts).not.toBeNull();
    expect(formatDurationIso(parts!)).toBe('P1Y2M3DT4H5M6S');
    expect(parseDuration('not-a-duration')).toBeNull();
  });

  test('normalizes supported color values for the native picker', () => {
    expect(normalizeColor('#abc')).toBe('#aabbcc');
    expect(normalizeColor('#11223344')).toBe('#112233');
    expect(normalizeColor('invalid')).toBe('#000000');
  });
});
