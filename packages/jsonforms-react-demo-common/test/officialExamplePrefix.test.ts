import { expect, test } from 'vitest';
import { registerExamples } from '@jsonforms/examples';

const stub = (name: string, label: string) =>
  ({ name, label, data: {}, schema: {}, uischema: { type: 'Label' } } as any);

// Isolated in its own file: it registers stub examples and imports the
// registry before any prefixing has run, which the shared example list cannot
// do once its module-level state is settled.
test('upstream jsonforms-* is prefixed again and never collides', async () => {
  // Simulate upstream shipping BOTH `foo` and `jsonforms-foo`, before any
  // prefixing has run.
  registerExamples([
    stub('foo', 'Foo'),
    stub('jsonforms-foo', 'Already Prefixed Looking'),
  ]);

  const { listExamples, isPrefixedOfficialExample } = await import(
    '../src/examples/registry'
  );
  const listed = listExamples();
  const byName = (n: string) => listed.find((e) => e.name === n);

  // upstream `foo` -> jsonforms-foo
  expect(byName('jsonforms-foo')?.label).toBe('JsonForms: Foo');
  // upstream `jsonforms-foo` -> jsonforms-jsonforms-foo, content intact
  expect(byName('jsonforms-jsonforms-foo')?.label).toBe(
    'JsonForms: Already Prefixed Looking'
  );
  // both tracked as copies
  expect(isPrefixedOfficialExample('jsonforms-foo')).toBe(true);
  expect(isPrefixedOfficialExample('jsonforms-jsonforms-foo')).toBe(true);
  // no unprefixed originals leak into the list, and no duplicates
  expect(byName('foo')).toBeUndefined();
  const names = listed.map((e) => e.name);
  expect(new Set(names).size).toBe(names.length);
});
