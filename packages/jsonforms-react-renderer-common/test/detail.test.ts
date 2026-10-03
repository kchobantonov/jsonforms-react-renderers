import { expect, it } from 'vitest';
import { resolveEditorDetail } from '../src/detail';
const schema = { type: 'object', properties: { name: { type: 'string' } } };
const fallback = { type: 'Control', scope: '#' };
const registered = { type: 'Label', text: 'Registered' };
const registry = [{ tester: () => 10, uischema: registered }];
it('carries generation through delegated controls and preserves registry modes', () => {
  expect(
    resolveEditorDetail(
      'generate',
      registry,
      schema,
      '#',
      'record',
      schema,
      fallback
    )
  ).toEqual({ ...fallback, options: { detail: 'GENERATE' } });
  for (const mode of ['DEFAULT', 'REGISTERED', 'GENERATED', 'custom']) {
    expect(
      resolveEditorDetail(
        mode,
        registry,
        schema,
        '#',
        'record',
        schema,
        fallback
      )
    ).toBe(registered);
  }
  expect(
    resolveEditorDetail(
      undefined,
      registry,
      schema,
      '#',
      'record',
      schema,
      fallback
    )
  ).toBe(fallback);
});
it('normalizes legacy inline layouts and falls back when no registry matches', () => {
  const elements = [{ type: 'Control', scope: '#/properties/name' }];
  expect(
    resolveEditorDetail(
      { elements },
      registry,
      schema,
      '#',
      'record',
      schema,
      fallback
    )
  ).toEqual({ type: 'VerticalLayout', elements });
  expect(
    resolveEditorDetail(
      'REGISTERED',
      [],
      schema,
      '#',
      'record',
      schema,
      fallback
    )
  ).toBe(fallback);
});
