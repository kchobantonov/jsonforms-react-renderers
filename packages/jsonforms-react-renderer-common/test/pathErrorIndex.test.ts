import { describe, it, expect } from 'vitest';
import { indexedPathErrors, labelDetailErrorPaths } from '../src/errorSummary';
describe('shared descendant error lists', () => {
  it('indexes required fields, avoids sibling prefix matches and reuses validation results', () => {
    const errors: any[] = [
      {
        instancePath: '/rows/10/contact',
        keyword: 'required',
        params: { missingProperty: 'city' },
        message: 'required',
      },
      {
        instancePath: '/rows/1/name',
        keyword: 'minLength',
        params: {},
        message: 'short',
      },
    ];
    const index = indexedPathErrors(errors);
    expect(index.get('rows')).toHaveLength(2);
    expect(index.get('rows.1')).toEqual([errors[1]]);
    expect(index.get('rows.10.contact.city')).toEqual([errors[0]]);
    expect(indexedPathErrors(errors)).toBe(index);
    expect(indexedPathErrors([...errors])).not.toBe(index);
  });
});

it('limits Label errors to explicit detail controls, excluding unrelated row fields', () => {
  const summary = { type: 'Label', text: 'Full name' };
  expect(labelDetailErrorPaths('rows.1', { summary })).toEqual([]);
  expect(
    labelDetailErrorPaths('rows.1', {
      summary,
      detail: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/properties/firstName' },
          { type: 'Control', scope: '#/properties/lastName' },
        ],
      },
    })
  ).toEqual(['rows.1.firstName', 'rows.1.lastName']);
  expect(
    labelDetailErrorPaths('rows.1.contact', {
      summary,
      detail: { type: 'Control', scope: '#' },
    })
  ).toEqual(['rows.1.contact']);
  expect(labelDetailErrorPaths('rows.1.contact', {})).toBeUndefined();
});
