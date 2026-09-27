import {
  antdColorControlTester,
  antdDurationControlTester,
  antdExtendedRenderers,
  antdMaskControlTester,
  antdNullControlTester,
  antdSplitLayoutTester,
} from '../src';

describe('Ant Design extended registry', () => {
  it('registers the native extended controls', () => {
    const testers = antdExtendedRenderers.map((entry) => entry.tester);
    expect(testers).toContain(antdColorControlTester);
    expect(testers).toContain(antdDurationControlTester);
    expect(testers).toContain(antdMaskControlTester);
    expect(testers).toContain(antdNullControlTester);
    expect(testers).toContain(antdSplitLayoutTester);
  });
});

describe('config namespace constants', () => {
  it('match across the two sibling packages', async () => {
    // They are duplicated because the packages are siblings with no shared
    // base, and depending on the extended one from the base renderer set would
    // pull ag-grid, Monaco and sucrase in for a single string. The literal is
    // a wire format, so drift would be a silent bug: fail here instead.
    const base = await import('@chobantonov/jsonforms-react-antd-renderers');
    const extended = await import(
      '@chobantonov/jsonforms-react-extended-renderers'
    );
    expect(base.JSONFORMS_EXTENDED_CONFIG_KEY).toBe(
      extended.JSONFORMS_EXTENDED_CONFIG_KEY
    );
    expect(base.JSONFORMS_CONFIG_KEY).toBe(extended.JSONFORMS_CONFIG_KEY);
  });
});
