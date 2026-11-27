import { createTranslator } from '@jsonforms/core';
import React, { act } from 'react';
import { useJsonForms } from '@jsonforms/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { mountHook } from '../support/hooks';
import { AllOfRenderer } from '../../src/composition/AllOfRenderer';
import { CombinatorProperties } from '../../src/composition/CombinatorProperties';
import { ScalarCompositionControl } from '../../src/composition/ScalarCompositionControl';
import { useCombinatorSelection } from '../../src/composition/useCombinatorSelection';
import {
  useScalarComposition,
  scalarCompositionTester,
} from '../../src/composition/useScalarComposition';
import {
  MixedNodeControl,
  MixedDetailControl,
  MixedCodeControl,
} from '../../src/mixed/MixedDetailControl';
import { useMixedScalar } from '../../src/mixed/mixedScalar';
import { ItemProvider, CellSummary } from '../../src/cells/CellSummary';
import {
  ObjectDetail,
  createObjectPresentation,
  createObjectRenderer,
  useObjectSchema,
  objectControlTester,
  ObjectDetailContext,
} from '../../src/objects/ObjectDetail';
import { ObjectErrorContext } from '../../src/validation/errorSummary';

const mounted: { unmount(): void }[] = [];
afterEach(() => mounted.splice(0).forEach((view) => view.unmount()));
const delegated = vi.fn();
function Delegate(props: any) {
  const context = useJsonForms() as any;
  delegated(props, context, useMixedScalar(props.path));
  return <span data-delegated>{props.path}</span>;
}
const renderers = [{ tester: () => 1, renderer: Delegate }];
const base: any = {
  schema: { type: 'string' },
  rootSchema: {},
  uischema: { type: 'Control', scope: '#' },
  path: 'value',
  enabled: true,
  visible: true,
  label: 'Value',
  handleChange: vi.fn(),
  renderers,
  uischemas: [],
};
function mount(render: () => React.ReactNode) {
  const view = mountHook(() => null, { context: { renderers }, render });
  mounted.push(view);
  return view;
}

describe('shared dispatch contracts', () => {
  it('delegates scalar compositions without losing the label or parent error', () => {
    const schema = {
      allOf: [
        { type: 'string', minLength: 3 },
        { type: 'string', maxLength: 5 },
      ],
    };
    let props = { ...base, schema };
    const view = mountHook(() => useScalarComposition(props), {
      schema,
      context: {
        i18n: {
          translate: createTranslator((_key, fallback) => fallback),
          translateError: () => 'Composition failed',
        },
      },
    });
    mounted.push(view);
    expect(view.current.delegated).toMatchObject({
      scope: '#',
      label: 'Value',
    });
    expect(view.current.delegatedSchema.type).toBe('string');
    view.rerender({
      core: {
        ...view.context.core!,
        errors: [
          {
            instancePath: '/value',
            schemaPath: '#/allOf',
            keyword: 'allOf',
            params: {},
          },
        ],
      },
    });
    expect(view.current.message).toBe('Composition failed');
    view.rerender({
      core: { ...view.context.core!, validationMode: 'ValidateAndHide' },
    });
    expect(view.current.message).toBeUndefined();
    props = { ...props, uischema: { ...props.uischema, label: false } };
    view.rerender();
    expect(view.current.delegated.label).toBe(false);
    expect(
      scalarCompositionTester(props.uischema, schema as any, {
        rootSchema: schema,
        config: {},
      }),
    ).toBe(4);
  });
  it('renders scalar delegated errors only when visible', () => {
    let visible = true;
    const schema = { allOf: [{ type: 'string' }] };
    const view = mountHook(() => null, {
      schema,
      context: {
        renderers,
        i18n: {
          translate: createTranslator((_key, fallback) => fallback),
          translateError: () => 'Invalid composition',
        },
      },
      render: () => (
        <ScalarCompositionControl
          {...base}
          schema={schema as any}
          visible={visible}
          errorClassName='error'
          errorStyle={{ color: 'red' }}
        />
      ),
    });
    mounted.push(view);
    view.rerender({
      core: {
        ...view.context.core!,
        errors: [
          {
            instancePath: '/value',
            schemaPath: '#',
            keyword: 'allOf',
            params: {},
          },
        ],
      },
    });
    expect(view.container.querySelector('[role=alert]')?.textContent).toBe(
      'Invalid composition',
    );
    visible = false;
    view.rerender();
    expect(view.container.innerHTML).toBe('');
  });
  it('renders allOf branches, shared properties, registry detail, and hidden states', () => {
    let props = {
      ...base,
      schema: {
        type: 'object',
        properties: { name: { type: 'string' } },
        allOf: [{ type: 'object', properties: { age: { type: 'number' } } }],
      },
    };
    const view = mount(() => <AllOfRenderer {...props} />);
    expect(
      view.container.querySelectorAll('[data-delegated]').length,
    ).toBeGreaterThanOrEqual(2);
    props = {
      ...props,
      uischemas: [
        { tester: () => 10, uischema: { type: 'Group', elements: [] } },
      ],
    };
    view.rerender();
    expect(view.container.querySelectorAll('[data-delegated]')).toHaveLength(1);
    props = { ...props, visible: false };
    view.rerender();
    expect(view.container.innerHTML).toBe('');
  });
  it.each([{}, { properties: {} }])(
    'omits empty shared properties %#',
    (schema) => {
      const view = mount(() => (
        <CombinatorProperties
          schema={schema}
          rootSchema={schema}
          path=''
          combinatorKeyword='oneOf'
        />
      ));
      expect(view.container.innerHTML).toBe('');
    },
  );
  it('builds translated branch labels and handles an absent combinator', () => {
    let schema: any = {
      oneOf: [
        { type: 'object', title: 'First', i18n: 'first' },
        { type: 'string', title: 'Second' },
      ],
    };
    const view = mountHook(
      () => useCombinatorSelection({ ...base, schema }, 'oneOf'),
      {
        context: {
          i18n: {
            translate: createTranslator((key, fallback) =>
              key === 'first.label' ? 'Translated' : fallback,
            ),
          },
        },
      },
    );
    mounted.push(view);
    expect(view.current.renderInfos.map((info) => info.label)).toEqual([
      'Translated',
      'Second',
    ]);
    schema = {};
    view.rerender();
    expect(view.current.renderInfos).toEqual([]);
  });
  it.each([
    'string',
    'number',
    'integer',
    'boolean',
    'object',
    'array',
    'null',
  ])('delegates selected %s nodes with scoped scalar context', (type) => {
    let node: any = {
      type,
      path: ['child'],
      data:
        type === 'null'
          ? null
          : type === 'object'
            ? {}
            : type === 'array'
              ? []
              : 2,
      schema: { type },
      label: 'Child',
      children: [],
    };
    let selector: any;
    const change = vi.fn();
    const view = mount(() => (
      <MixedNodeControl
        {...base}
        node={node}
        rootSchema={{}}
        handleChange={change}
        withoutControlLabel={(ui) => ({ ...ui, label: false })}
        MixedTypeSelector={(props) => {
          selector = props;
          return (
            <button onClick={() => props.onChange('string')}>Change</button>
          );
        }}
        wrapStructured={(children) => <section>{children}</section>}
      />
    ));
    expect(selector.clearable).toBe(false);
    expect(Boolean(view.container.querySelector('[data-delegated]'))).toBe(
      type !== 'null',
    );
    act(() => view.container.querySelector('button')!.click());
    if (type !== 'string') expect(change).toHaveBeenCalled();
    node = undefined;
    view.rerender();
    expect(view.container.innerHTML).toBe('');
  });
  it('delegates root details and avoids null or absent editors', () => {
    let selectedType: any = 'string';
    const view = mount(() => (
      <MixedDetailControl
        {...base}
        selectedType={selectedType}
        selectedSchema={{ type: 'string' }}
        detailUiSchema={base.uischema}
        withoutControlLabel={(ui) => ui}
      />
    ));
    expect(view.container.querySelector('[data-delegated]')).not.toBeNull();
    selectedType = 'null';
    view.rerender();
    expect(view.container.innerHTML).toBe('');
  });
  it('requests JSON code editing once and diagnoses a missing extended renderer', () => {
    let props = base;
    const view = mount(() => <MixedCodeControl {...props} />);
    expect(delegated.mock.calls.at(-1)?.[0].uischema.options).toMatchObject({
      format: 'code',
      convertJson: true,
      validateJsonSchema: true,
      propagateErrors: true,
    });
    props = {
      ...base,
      uischema: { ...base.uischema, options: { format: 'code' } },
    };
    view.rerender();
    expect(view.container.querySelector('[role=alert]')?.textContent).toContain(
      'Monaco',
    );
  });
  it('provides source rows to summaries without enabling editing', () => {
    const view = mountHook(() => null, {
      data: { rows: [{ name: 'one' }] },
      context: { renderers },
      render: () => (
        <ItemProvider path='rows.0'>
          <CellSummary
            path='rows.0'
            schema={{ type: 'object' }}
            uischema={base.uischema}
          />
        </ItemProvider>
      ),
    });
    mounted.push(view);
    expect(delegated.mock.calls.at(-1)?.[0].enabled).toBe(false);
    const ctx = delegated.mock.calls.at(-1)?.[1];
    expect(ctx.item).toEqual({ name: 'one' });
    expect(ctx.item).toBe(ctx.item);
    view.replaceData({ rows: [{ name: 'two' }] });
    expect(delegated.mock.calls.at(-1)?.[1].item).toEqual({ name: 'two' });
  });
  it('exposes object detail and error ownership while omitting empty static layouts', () => {
    let ui: any = { type: 'VerticalLayout', elements: [] };
    const observed = vi.fn();
    function ContextProbe() {
      const detail = React.useContext(ObjectDetailContext);
      const errors = React.useContext(ObjectErrorContext);
      React.useLayoutEffect(() => {
        observed(detail, errors);
      }, [detail, errors]);
      return <span>Detail</span>;
    }
    const registry = [{ tester: () => 1, renderer: ContextProbe }];
    const view = mount(() => (
      <ObjectDetail
        props={{ ...base, renderers: registry }}
        schema={{ type: 'object' }}
        uischema={ui}
        diagnostics={['diagnostic']}
        errors='Object failed'
        additional={<span>Extra</span>}
      />
    ));
    expect(view.container.textContent).toBe('diagnostic');
    ui = { type: 'Group', elements: [] };
    view.rerender();
    expect(observed.mock.calls.at(-1)?.[0].uischema).toBe(ui);
    expect(observed.mock.calls.at(-1)?.[1].message).toBe('Object failed');
  });
  it('builds conditional object schemas and ranks conditional object controls', () => {
    const schema: any = {
      type: 'object',
      properties: { name: { type: 'string' } },
      if: { required: ['kind'] },
      // oxlint-disable-next-line unicorn/no-thenable -- JSON Schema conditional keyword.
      then: { properties: { conditional: { type: 'string' } } },
    };
    const props = {
      ...base,
      schema,
      rootSchema: schema,
      data: {},
      uischema: { ...base.uischema, options: { conditionalFields: true } },
    };
    const view = mountHook(() => useObjectSchema(props));
    mounted.push(view);
    expect(view.current.additionalSchema.properties).toHaveProperty('name');
    expect(
      objectControlTester(props.uischema, schema, {
        rootSchema: schema,
        config: {},
      }),
    ).toBe(25);
    expect(
      objectControlTester({ type: 'Label' }, schema, {
        rootSchema: schema,
        config: {},
      }),
    ).toBe(-1);
  });
});

it.each(['Group', 'VerticalLayout'])(
  'preserves object frame and additional-property ownership for %s',
  (type) => {
    const Additional = (props: any) => (
      <aside data-embedded={String(props.embedded)}>Additional fields</aside>
    );
    const present = createObjectPresentation(Additional);
    const ui = { type, elements: [] };
    let props = {
      ...base,
      path: 'object',
      label: 'Object',
      schema: { type: 'object' },
      data: {},
    };
    const view = mountHook(
      () =>
        present(props, useObjectSchema(props), ui, new Set(), 'Object error'),
      {
        context: { renderers },
        render: (state) => (
          <>
            {state.detail}
            {state.additional}
          </>
        ),
      },
    );
    mounted.push(view);
    expect(view.current.isGroup).toBe(type === 'Group');
    expect(view.current.title).toBe('Object');
    expect(view.container.querySelector('aside')?.dataset.embedded).toBe(
      'true',
    );
    props = {
      ...props,
      path: '',
      uischema: { ...props.uischema, label: false },
    };
    view.rerender();
    expect(view.current.title).toBeUndefined();
    expect(view.container.querySelector('aside')?.dataset.embedded).toBe(
      String(type === 'Group'),
    );
  },
);

it.each([false, true])(
  'retains the native object frame and generated-label policy: hide=%s',
  (hideLabel) => {
    const Frame = ({ detail, additional }: any) => (
      <section data-native-object-frame>
        {detail}
        {additional}
      </section>
    );
    const Additional = () => <aside>Additional</aside>;
    const Renderer = createObjectRenderer(Additional, Frame, hideLabel);
    let props = {
      ...base,
      path: '',
      schema: { type: 'object' },
      data: {},
      uischema: { ...base.uischema, label: false },
    };
    const view = mount(() => <Renderer {...props} />);
    expect(
      view.container.querySelector('[data-native-object-frame]'),
    ).not.toBeNull();
    expect(view.container.querySelector('aside')?.textContent).toBe(
      'Additional',
    );
    props = { ...props, path: 'object' };
    view.rerender();
    expect(
      view.container.querySelector('[data-native-object-frame]'),
    ).toBeNull();
    expect(delegated.mock.calls.at(-1)?.[0].uischema.label).toBe(
      hideLabel ? undefined : 'Value',
    );
    props = { ...props, visible: false };
    view.rerender();
    expect(view.container.innerHTML).toBe('');
  },
);
