import {
  antdColorControlTester,
  antdDurationControlTester,
  antdExtendedRenderers,
  antdNullControlTester,
  antdSplitLayoutTester,
} from '../src';

describe('Ant Design extended registry', () => {
  it('registers the native extended controls', () => {
    const testers = antdExtendedRenderers.map((entry) => entry.tester);
    expect(testers).toContain(antdColorControlTester);
    expect(testers).toContain(antdDurationControlTester);
    expect(testers).toContain(antdNullControlTester);
    expect(testers).toContain(antdSplitLayoutTester);
  });
});
