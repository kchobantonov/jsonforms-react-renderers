import { describe, it, expect } from 'vitest';
import { labelFilterValue } from '../src/util/labelFilterValue';

describe('Label filter values', () => {
  const label = { type: 'Label', text: '{city} · {phone}', options: {
    interpolate: true, textParams: { city: '{item.contact.city}', phone: '{item.contact.phone}' },
  } };
  const item = { contact: { city: 'Boston', phone: '555-0100' } };
  it('filters on both resolved summary fields', () => {
    expect(labelFilterValue(label, {}, item, { jsonformsExtended: { dynamicValues: { enabled: true } } }))
      .toBe('Boston · 555-0100');
  });
  it('does not expose row data when dynamic values are disabled', () => {
    const value = labelFilterValue(label, {}, item, {});
    expect(value).not.toContain('Boston');
    expect(value).not.toContain('555-0100');
  });
});

it('resolves item only when an expression reads it', async () => {
  const { buildNamespaceScope } = await import('../src/util/interpolate');
  const { evaluateWith } = await import('../src/util/celEnvironment');
  let reads = 0;
  const scope = buildNamespaceScope({
    data: { title: 'Form' }, dynamicAllowed: true,
    get item() { reads++; return { name: 'Applicant' }; },
  });
  expect(reads).toBe(0);
  expect(evaluateWith('data.title', scope, 'en')).toBe('Form');
  expect(reads).toBe(0);
  expect(evaluateWith('item.name', scope, 'en')).toBe('Applicant');
  expect(reads).toBeGreaterThan(0);
});
