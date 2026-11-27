import React, { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { defaultTranslator, createTranslator } from '@jsonforms/core';
import { mountHook } from '../support/hooks';
import {
  useErrorSummary,
  useErrorSummaryCount,
  usePathErrorMessages,
  usePathErrorIndicator,
  useAdditionalPropertyErrors,
  usePropertyNameErrors,
  formatErrorSummary,
} from '../../src/validation/errorSummary';
import {
  CollectionErrorNavigation,
  RowErrorCount,
} from '../../src/collections/CollectionErrorNavigation';
import { ItemValidationIndicator } from '../../src/validation/ItemValidationIndicator';
const mounted: { unmount(): void }[] = [];
afterEach(() => mounted.splice(0).forEach((view) => view.unmount()));
const error = (
  instancePath: string,
  keyword = 'custom',
  params = {},
  message = 'Invalid',
) => ({ instancePath, keyword, schemaPath: '#', params, message });
const schema: any = {
  type: 'object',
  properties: {
    rows: {
      type: 'array',
      title: 'Rows',
      items: {
        type: 'object',
        properties: { name: { type: 'string', title: 'Name' } },
      },
    },
  },
};
function setup(errors: any[], render?: () => React.ReactNode) {
  const view = mountHook(() => null, { schema, render });
  mounted.push(view);
  view.rerender({ core: { ...view.context.core!, errors } });
  return view;
}

describe('error navigation and presentation', () => {
  it('reveals the first invalid row and renders separate per-row counts', () => {
    const reveal = vi.fn();
    const view = setup(
      [
        error('/rows/2/name'),
        error('/rows/2', 'required', { missingProperty: 'other' }),
        error('/rows/4/name'),
      ],
      () => (
        <>
          <CollectionErrorNavigation path='rows' reveal={reveal} />
          <RowErrorCount path='rows' index={2} />
          <RowErrorCount path='rows' index={4} />
          <RowErrorCount path='rows' index={0} />
        </>
      ),
    );
    act(() => view.container.querySelector('button')!.click());
    expect(reveal).toHaveBeenCalledWith(2);
    expect(view.container.querySelectorAll('[role=img]')).toHaveLength(2);
    expect(
      view.container
        .querySelectorAll('[role=img]')[0]
        .getAttribute('aria-label'),
    ).toContain('2');
  });
  it('supports native action and indicator adapters', () => {
    const reveal = vi.fn();
    const indicator = vi.fn((message) => <i>{message}</i>);
    const view = setup([error('/rows/1/name')], () => (
      <>
        <CollectionErrorNavigation
          path='rows'
          reveal={reveal}
          renderAction={(label, click, icon) => (
            <button onClick={click}>
              {icon}
              {label}
            </button>
          )}
        />
        <RowErrorCount path='rows' index={1} renderIndicator={indicator} />
      </>
    ));
    act(() => view.container.querySelector('button')!.click());
    expect(reveal).toHaveBeenCalledWith(1);
    expect(indicator).toHaveBeenCalled();
  });
  it('omits actions for container-only errors and the entire empty navigation', () => {
    const view = setup([error('/rows', 'minItems')], () => (
      <CollectionErrorNavigation path='rows' reveal={vi.fn()} />
    ));
    expect(view.container.querySelector('[role=status]')).not.toBeNull();
    expect(view.container.querySelector('button')).toBeNull();
    view.rerender({ core: { ...view.context.core!, errors: [] } });
    expect(view.container.innerHTML).toBe('');
  });
  it('counts and formats indexed, fallback and inactive summaries independently', () => {
    let active = true;
    let path: string | undefined = 'rows';
    let fallback = 'first\nsecond';
    const view = mountHook(
      () => ({
        summary: useErrorSummary(fallback, path, active),
        count: useErrorSummaryCount(fallback, path),
        messages: usePathErrorMessages('rows'),
        selected: usePathErrorMessages('rows', ['rows.1', 'rows.1', 'missing']),
        indicator: usePathErrorIndicator('rows', {
          showValidationIndicatorCount: true,
        }),
        own: usePathErrorIndicator('rows', {}, false),
      }),
      { schema },
    );
    mounted.push(view);
    expect(view.current.summary).toEqual([
      { path: '', message: 'first' },
      { path: '', message: 'second' },
    ]);
    expect(view.current.count).toBe(2);
    view.rerender({
      core: {
        ...view.context.core!,
        errors: [
          error('/rows/1/name'),
          error('/rows', 'minItems', {}, 'Too few'),
        ],
      },
    });
    expect(view.current.summary).toHaveLength(2);
    expect(view.current.messages).toContain('Rows / 2 / Name: Invalid');
    expect(view.current.selected).toBe('Rows / 2 / Name: Invalid');
    expect(view.current.own).toBe('Too few');
    expect(view.current.indicator).toContain('Too few');
    active = false;
    view.rerender();
    expect(view.current.summary).toEqual([]);
    path = undefined;
    active = true;
    view.rerender();
    expect(view.current.summary[0].message).toBe('first');
    fallback = '';
    view.rerender();
    expect(view.current.summary).toEqual([]);
    expect(view.current.count).toBe(0);
    view.rerender({ core: undefined });
    expect(view.current.messages).toBe('');
  });
  it('keeps literal property-name errors separate from disallowed property errors', () => {
    const view = mountHook(() => ({
      additional: useAdditionalPropertyErrors('object'),
      names: usePropertyNameErrors('object'),
    }));
    mounted.push(view);
    const specific = {
      ...error('/object', 'pattern', {}, 'Bad name'),
      propertyName: 'a.b',
    };
    view.rerender({
      core: {
        ...view.context.core!,
        errors: [
          specific,
          error(
            '/object',
            'propertyNames',
            { propertyName: 'a.b' },
            'Invalid property',
          ),
          error('/object', 'propertyNames', { propertyName: '' }, 'Empty name'),
          error(
            '/object',
            'additionalProperties',
            { additionalProperty: 'a.b' },
            'Not allowed',
          ),
          error('/elsewhere', 'additionalProperties', {
            additionalProperty: 'other',
          }),
        ],
      },
    });
    expect(view.current.additional).toBe('a.b: Not allowed');
    expect(view.current.names.get('a.b')).toBe('Bad name');
    expect(view.current.names.get('')).toBe('Empty name');
    expect(view.current.names.size).toBe(2);
  });
  it('shows container indicators only when configured and errors are displayable', () => {
    const Indicator = ({ count }: { count?: number }) => (
      <span data-count={count}>Invalid</span>
    );
    const view = setup([error('/rows/0/name')], () => (
      <ItemValidationIndicator
        path='rows'
        options={{
          showValidationIndicator: true,
          showValidationIndicatorCount: true,
        }}
        Indicator={Indicator}
      />
    ));
    expect(
      view.container.querySelector('[data-count]')?.getAttribute('data-count'),
    ).toBe('1');
    view.rerender({
      core: { ...view.context.core!, validationMode: 'ValidateAndHide' },
    });
    expect(view.container.innerHTML).toBe('');
  });
  it('formats references, tuple positions, escaped keys and missing schema labels', () => {
    const root: any = {
      type: 'object',
      definitions: {
        child: { type: 'object', properties: { 'a/b': { title: 'Slash' } } },
      },
      properties: {
        child: { $ref: '#/definitions/child' },
        tuple: { type: 'array', items: [{ type: 'string', title: 'First' }] },
      },
    };
    const ui: any = {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/child/properties/a~1b',
          label: 'Overridden',
        },
      ],
    };
    expect(
      formatErrorSummary([error('/child/a~1b')], root, ui, defaultTranslator)[0]
        .path,
    ).toBe('child / Overridden');
    expect(
      formatErrorSummary(
        [error('/tuple/0')],
        root,
        undefined,
        defaultTranslator,
      )[0].path,
    ).toBe('tuple / 1');
    expect(
      formatErrorSummary(
        [error('/unknown')],
        undefined,
        undefined,
        createTranslator(() => undefined),
      )[0].path,
    ).toBe('unknown');
  });
});
