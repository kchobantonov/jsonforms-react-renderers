import {
  createDefaultValue,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  rankWith,
} from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  MixedRenderer,
  mixedControlTester,
  schemaForType,
} from '../../src/complex/MixedRenderer';
import { antdRenderers } from '../../src';
import { AntdMixedTree } from '../../src/complex/mixed/AntdMixedTree';
import { buildMixedTree } from '../../src/complex/mixed/mixedTree';

const schema: JsonSchema = {
  type: ['object', 'array', 'string', 'null'],
  additionalProperties: true,
  items: { type: 'string' },
};
const renderers: JsonFormsRendererRegistryEntry[] = [
  { tester: mixedControlTester, renderer: MixedRenderer },
  { tester: rankWith(1, () => true), renderer: () => <div /> },
];

const renderMixedValue = (data: unknown) =>
  renderToStaticMarkup(
    <JsonForms
      data={data}
      schema={schema}
      uischema={{ type: 'Control', scope: '#' }}
      renderers={renderers}
    />
  );

const renderMixedPrimitive = (data: unknown) =>
  renderToStaticMarkup(
    <JsonForms
      data={data}
      schema={{
        type: [
          'array',
          'boolean',
          'integer',
          'null',
          'number',
          'object',
          'string',
        ],
      }}
      uischema={{ type: 'Control', scope: '#' }}
      renderers={antdRenderers}
    />
  );

describe('MixedRenderer', () => {
  it.each([
    ['object', {}],
    ['array', []],
  ])('renders the %s Ant Design detail panel open by default', (type, data) => {
    const html = renderMixedValue(data);

    expect(html).toContain('ant-collapse-item-active');
    expect(html).toContain('ant-collapse-icon-placement-end');
    expect(html).toContain('jsonforms-mixed-renderer-structured');
    expect(html).toContain(type === 'array' ? '[]' : '{}');
    expect(html).toContain('Search tree...');
  });

  it('renders primitive values beside an Ant Design type selector', () => {
    const html = renderMixedValue('value');

    expect(html).toContain('jsonforms-mixed-renderer-primitive');
    expect(html).toContain('jsonforms-mixed-renderer-type');
    expect(html).toContain('jsonforms-mixed-renderer-value');
    expect(html).toContain('ant-select');
    expect(html).toContain('ant-select-allow-clear');
    expect(html).not.toContain('<select');
    expect(html.indexOf('class="jsonforms-mixed-renderer-type"')).toBeLessThan(
      html.indexOf('class="jsonforms-mixed-renderer-value"')
    );
  });

  it.each([
    ['string', 'value', 'ant-input'],
    ['integer', 1, 'ant-input-number'],
    ['number', 1.5, 'ant-input-number'],
    ['boolean', true, 'ant-checkbox'],
  ])(
    'dispatches the selected %s value through its regular Ant Design control',
    (_type, data, expectedClass) => {
      const html = renderMixedPrimitive(data);

      expect(html).toContain('jsonforms-mixed-renderer-primitive');
      expect(html).toContain(expectedClass);
    }
  );

  it('does not render a value control for null', () => {
    const html = renderMixedValue(null);

    expect(html).toContain('title="null"');
    expect(html).not.toContain('No applicable renderer found');
  });

  it('does not render a value control before a type is selected', () => {
    const html = renderMixedValue(undefined);

    expect(html).toContain('Select a type');
    expect(html).toContain('jsonforms-mixed-renderer-unselected');
    expect(html).toContain('jsonforms-mixed-type-selector-full-width');
    expect(html).not.toContain('class="jsonforms-mixed-renderer-value"');
    expect(html).not.toContain('class="jsonforms-mixed-renderer-detail');
  });

  it('renders aligned tree rows with JSON type icons and trailing actions', () => {
    const html = renderMixedPrimitive(['first', {}]);

    expect(html).toContain('jsonforms-mixed-tree-row');
    expect(html).toContain('[]');
    expect(html).toContain('aria-label="object value"');
    expect(html).toContain('aria-label="Show primitives"');
    expect(html).toContain('aria-label="Delete Item 1"');
    expect(html).toContain('ant-tree-block-node');
  });

  it('exposes rename only for dynamic object properties', () => {
    const html = renderToStaticMarkup(
      <JsonForms
        data={{ custom: {} }}
        schema={schema}
        uischema={{ type: 'Control', scope: '#' }}
        renderers={antdRenderers}
      />
    );

    expect(html).toContain('aria-label="Rename custom"');
    expect(html).toContain('aria-label="Delete custom"');
    expect(html).toContain('Additional Properties');
  });

  it('removes constraints that are invalid for the selected type', () => {
    expect(
      schemaForType(
        {
          type: ['array', 'string'],
          items: { type: 'number' },
          minItems: 2,
          minLength: 4,
        },
        'string',
        {}
      )
    ).toEqual({ type: 'string', minLength: 4 });
  });

  it('does not reuse an incompatible mixed-schema default when changing type', () => {
    const objectSchema = schemaForType(
      {
        type: ['object', 'boolean'],
        default: true,
        properties: { title: { type: 'string' } },
      },
      'object',
      {}
    );

    expect(objectSchema).not.toHaveProperty('default');
    expect(createDefaultValue(objectSchema, {})).toEqual({});
  });
});

describe('AntdMixedTree', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        disconnect() {}
        observe() {}
        unobserve() {}
      }
    );
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it('uses aligned Svelte-style type marks for every JSON value type', () => {
    const tree = buildMixedTree(
      [[], false, 0, null, 0.5, {}, ''],
      { type: 'array', items: true },
      {}
    );

    act(() => {
      root.render(
        <AntdMixedTree
          canDelete={() => true}
          canRename={() => false}
          onDelete={vi.fn()}
          onRename={vi.fn()}
          onSelect={vi.fn()}
          root={tree}
          selectedPath={[]}
          validateRename={() => undefined}
        />
      );
    });
    const showPrimitives = container.querySelector(
      '[aria-label="Show primitives"]'
    ) as HTMLButtonElement;
    act(() => showPrimitives.click());

    [
      'array',
      'boolean',
      'integer',
      'null',
      'number',
      'object',
      'string',
    ].forEach((type) => {
      expect(
        container.querySelector(`[aria-label="${type} value"]`)
      ).not.toBeNull();
    });
    const labels = Array.from(
      container.querySelectorAll('.jsonforms-mixed-tree-label')
    ).map((element) => element.textContent);
    expect(labels).toEqual(tree.children.map((node) => node.label));
    expect(
      container.querySelector(
        '.ant-tree-treenode:first-child > .ant-tree-node-content-wrapper .ant-tree-iconEle [aria-label="array value"]'
      )
    ).not.toBeNull();
  });

  it('uses the regular object type icon for an object root', () => {
    const tree = buildMixedTree({}, { type: 'object' }, {});

    act(() => {
      root.render(
        <AntdMixedTree
          canDelete={() => true}
          canRename={() => false}
          onDelete={vi.fn()}
          onRename={vi.fn()}
          onSelect={vi.fn()}
          root={tree}
          selectedPath={[]}
          validateRename={() => undefined}
        />
      );
    });

    expect(
      container.querySelector(
        '.ant-tree-treenode:first-child > .ant-tree-node-content-wrapper .ant-tree-iconEle [aria-label="object value"]'
      )
    ).not.toBeNull();
    expect(
      container.querySelector(
        '.ant-tree-treenode:first-child .jsonforms-mixed-tree-label'
      )
    ).toBeNull();
  });

  it('expands only the root tree level initially', () => {
    const tree = buildMixedTree(
      [{ nested: { deep: true } }],
      { type: 'array', items: true },
      {}
    );

    act(() => {
      root.render(
        <AntdMixedTree
          canDelete={() => true}
          canRename={() => false}
          onDelete={vi.fn()}
          onRename={vi.fn()}
          onSelect={vi.fn()}
          root={tree}
          selectedPath={[]}
          validateRename={() => undefined}
        />
      );
    });

    expect(container.textContent).toContain('Item 0');
    expect(container.textContent).not.toContain('nested');
    expect(container.textContent).not.toContain('deep');
  });

  it('shows a type selector and regular renderer for a selected non-root node', () => {
    act(() => {
      root.render(
        <JsonForms
          data={[{}]}
          schema={{
            type: [
              'array',
              'boolean',
              'integer',
              'null',
              'number',
              'object',
              'string',
            ],
            items: true,
          }}
          uischema={{ type: 'Control', scope: '#' }}
          renderers={antdRenderers}
        />
      );
    });

    const item = Array.from(
      container.querySelectorAll('.jsonforms-mixed-tree-label')
    ).find((element) => element.textContent === 'Item 0') as HTMLElement;
    act(() => item.click());

    const detail = container.querySelector(
      '.jsonforms-mixed-renderer-detail-type'
    );
    expect(detail?.querySelector('.ant-select')).not.toBeNull();
    expect(detail?.textContent).toContain('object');
    const breadcrumb = container.querySelector('.ant-breadcrumb');
    expect(
      breadcrumb?.querySelector('[aria-label="array value"]')
    ).not.toBeNull();
    expect(breadcrumb?.querySelector('[aria-label="object value"]')).toBeNull();
    expect(breadcrumb?.textContent).toContain('Item 0');
    expect(
      breadcrumb?.querySelector('[aria-label="array value"]')?.closest('a')
    ).not.toBeNull();
    expect(
      container.querySelector('.jsonforms-mixed-renderer-detail-control')
        ?.textContent
    ).toContain('Additional Properties');
  });

  it('uses a registered detail UI schema for a recursive additional property node', () => {
    const recursiveSchema: JsonSchema = {
      $id: 'https://example.com/recursive-meta-schema',
      type: ['object', 'boolean'],
      properties: {
        properties: {
          type: 'object',
          additionalProperties: { $ref: '#' },
        },
        title: { type: 'string' },
      },
    };

    act(() => {
      root.render(
        <JsonForms
          data={{ properties: { name: { type: 'string' } } }}
          schema={recursiveSchema}
          uischema={{ type: 'Control', scope: '#' }}
          uischemas={[
            {
              tester: (candidate, _schemaPath, path) =>
                candidate.$id === 'https://example.com/recursive-meta-schema' &&
                candidate.type === 'object' &&
                path === 'properties.name'
                  ? 10
                  : -1,
              uischema: {
                type: 'Label',
                text: 'Resolved recursive detail',
              },
            },
          ]}
          renderers={antdRenderers}
        />
      );
    });

    const propertiesNode = Array.from(
      container.querySelectorAll('.jsonforms-mixed-tree-label')
    ).find((element) => element.textContent === 'properties') as HTMLElement;
    const propertiesRow = propertiesNode.closest('.ant-tree-treenode');
    const switcher = propertiesRow?.querySelector(
      '.ant-tree-switcher'
    ) as HTMLElement;
    act(() => switcher.click());

    const nameNode = Array.from(
      container.querySelectorAll('.jsonforms-mixed-tree-label')
    ).find((element) => element.textContent === 'name') as HTMLElement;
    act(() => nameNode.click());

    expect(container.querySelector('.ant-breadcrumb')?.textContent).toContain(
      'name'
    );
    expect(
      container.querySelector('.jsonforms-mixed-renderer-detail-control')
        ?.textContent
    ).toContain('Resolved recursive detail');
  });

  it('shows a selected primitive node type and value on the same row', () => {
    act(() => {
      root.render(
        <JsonForms
          data={['text']}
          schema={{
            type: [
              'array',
              'boolean',
              'integer',
              'null',
              'number',
              'object',
              'string',
            ],
            items: true,
          }}
          uischema={{ type: 'Control', scope: '#' }}
          renderers={antdRenderers}
        />
      );
    });

    const showPrimitives = container.querySelector(
      '[aria-label="Show primitives"]'
    ) as HTMLElement;
    act(() => showPrimitives.click());

    const item = Array.from(
      container.querySelectorAll('.jsonforms-mixed-tree-label')
    ).find((element) => element.textContent === 'Item 0') as HTMLElement;
    act(() => item.click());

    const primitiveDetail = container.querySelector(
      '.jsonforms-mixed-renderer-detail-primitive'
    );
    const type = primitiveDetail?.querySelector(
      '.jsonforms-mixed-renderer-detail-type'
    );
    const control = primitiveDetail?.querySelector(
      '.jsonforms-mixed-renderer-detail-control'
    );

    expect(type?.textContent).toContain('string');
    expect(control?.querySelector('.ant-input')).not.toBeNull();
    expect(
      Boolean(type && control && type.compareDocumentPosition(control) & 4)
    ).toBe(true);
  });

  it.each([
    ['array', [[]]],
    ['object', [{}]],
  ])(
    'renders complex %s children as a type selector with a View icon',
    (type, data) => {
      act(() => {
        root.render(
          <JsonForms
            data={data}
            schema={{
              type: [
                'array',
                'boolean',
                'integer',
                'null',
                'number',
                'object',
                'string',
              ],
              items: true,
            }}
            uischema={{ type: 'Control', scope: '#' }}
            renderers={antdRenderers}
          />
        );
      });

      const headers = container.querySelectorAll('.ant-collapse-header');
      act(() => (headers[headers.length - 1] as HTMLElement).click());

      const nested = container.querySelector(
        '.jsonforms-mixed-nested-navigation'
      );
      expect(nested?.textContent).toContain(type);
      expect(nested?.querySelector('[aria-label^="View "]')).not.toBeNull();
      expect(nested?.querySelector('.anticon-eye')).not.toBeNull();
      expect(
        nested?.querySelector('.jsonforms-mixed-renderer-structured')
      ).toBeNull();
    }
  );
});
