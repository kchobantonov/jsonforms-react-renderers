import { describe, expect, it } from 'vitest';
import { defaultTranslator } from '@jsonforms/core';
import { formatErrorSummary } from '../src/errorSummary';
const schema = {
  type: 'object',
  properties: {
    comments: {
      type: 'array',
      title: 'Comments',
      items: {
        type: 'object',
        properties: { message: { type: 'string', title: 'Message' } },
      },
    },
  },
};
const errors = [0, 1].map((index) => ({
  instancePath: `/comments/${index}/message`,
  schemaPath: '#/properties/comments/items/properties/message/maxLength',
  keyword: 'maxLength',
  params: { limit: 5 },
  message: 'Use at most five characters.',
}));
describe('structured error summaries', () => {
  it('keeps identical messages on different rows separate', () => {
    expect(
      formatErrorSummary(errors, schema, undefined, defaultTranslator)
    ).toEqual([
      {
        path: 'Comments / 1 / Message',
        message: 'Use at most five characters.',
      },
      {
        path: 'Comments / 2 / Message',
        message: 'Use at most five characters.',
      },
    ]);
  });
  it('uses control overrides before a custom error translator', () => {
    const ui = {
      type: 'Control',
      scope: '#/properties/comments/items/properties/message',
      i18n: 'comment',
    };
    const translate = (key: string, fallback?: string) =>
      key === 'comment.error.custom'
        ? 'Please shorten your comment.'
        : fallback;
    expect(
      formatErrorSummary(errors, schema, ui, translate, () => 'Other')[0]
        .message
    ).toBe('Please shorten your comment.');
  });
  it('preserves host and schema custom messages and missing-property paths', () => {
    const error = {
      ...errors[0],
      instancePath: '/comments/0',
      keyword: 'required',
      params: { missingProperty: 'message' },
      message: 'Enter a comment for this booking.',
    };
    expect(
      formatErrorSummary([error], schema, undefined, defaultTranslator)[0]
    ).toEqual({
      path: 'Comments / 1 / Message',
      message: 'Enter a comment for this booking.',
    });
  });
});

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorSummaryList } from '../src/errorSummary';
it('expands and collapses a bounded summary without changing its count', () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  try {
    const entries = Array.from({ length: 7 }, (_, i) => ({
      path: `Row ${i + 1}`,
      message: 'Please enter a value.',
    }));
    act(() =>
      root.render(
        <ErrorSummaryList
          entries={entries}
          renderToggle={(label, toggle, expanded) => (
            <button onClick={toggle} aria-expanded={expanded}>
              {label}
            </button>
          )}
        />
      )
    );
    expect(host.querySelectorAll('li')).toHaveLength(3);
    expect(host.textContent).toContain('7 errors');
    expect(host.querySelector('button')?.textContent).toBe('Show 4 more');
    act(() => host.querySelector('button')!.click());
    expect(host.querySelectorAll('li')).toHaveLength(7);
    expect(host.querySelector('button')?.getAttribute('aria-expanded')).toBe(
      'true'
    );
    act(() => host.querySelector('button')!.click());
    expect(host.querySelectorAll('li')).toHaveLength(3);
    expect(host.textContent).toContain('7 errors');
  } finally {
    act(() => root.unmount());
  }
});
