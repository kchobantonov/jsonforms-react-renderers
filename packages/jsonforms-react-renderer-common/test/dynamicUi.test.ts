import { beforeAll } from 'vite-plus/test';
import { loadDynamicUiExpressions } from '../src/dynamicRuntime';
beforeAll(loadDynamicUiExpressions);
import { describe, expect, it } from 'vite-plus/test';
import type { UISchemaElement } from '@jsonforms/core';
import {
  createDynamicUiMemo,
  createDynamicUiResolver,
  dynamicPath,
  resolveDynamicUi,
} from '../src/dynamicUi';

const authored = {
  type: 'Control',
  scope: '#/properties/plan',
  label: 'Plan',
  $dynamic: [
    {
      overlay: {
        label: { bind: 'external.settings.label' },
        options: { readonly: { bind: 'external.settings.readonly' } },
      },
    },
    {
      when: { expression: "external.settings.presentation == 'radio'" },
      overlay: { options: { format: 'radio' } },
    },
  ],
} as unknown as UISchemaElement;
const input = (settings: object) => ({
  data: { plan: 'pro' },
  path: '',
  external: { settings },
});

describe('$dynamic UI resolution', () => {
  it('uses only referenced roots and reevaluates new immutable data snapshots', () => {
    const ui = {
      type: 'Control',
      scope: '#/properties/name',
      label: 'Static',
      $dynamic: { label: { template: '{data.name} in {external.region}' } },
    } as unknown as UISchemaElement;
    const unused = Object.defineProperty({}, 'bad', {
      enumerable: true,
      get() {
        throw Error('must not read unused config');
      },
    });
    expect(
      resolveDynamicUi(ui, {
        data: { name: 'Ada' },
        path: '',
        external: { region: 'North' },
        config: unused,
      }),
    ).toMatchObject({ element: { label: 'Ada in North' }, failures: [] });
    expect(
      resolveDynamicUi(ui, {
        data: { name: 'Grace' },
        path: '',
        external: { region: 'South' },
        config: unused,
      }),
    ).toMatchObject({ element: { label: 'Grace in South' }, failures: [] });
  });

  it('shares frozen validated roots without allowing a trusted function to alter another result', () => {
    const data = { name: 'Ada' };
    const mutator = {
      type: 'Control',
      scope: '#/properties/name',
      $dynamic: {
        label: (environment: { data: { name: string } }) => {
          environment.data.name = 'Changed';
          return environment.data.name;
        },
      },
    } as unknown as UISchemaElement;
    const reader = {
      type: 'Control',
      scope: '#/properties/name',
      $dynamic: { label: { bind: 'data.name' } },
    } as unknown as UISchemaElement;
    expect(
      resolveDynamicUi(mutator, { data, path: '', trustedFunctions: true })
        .failures,
    ).toEqual(['rule 0: invalid target label']);
    expect(resolveDynamicUi(reader, { data, path: '' }).element).toMatchObject({
      label: 'Ada',
    });
    expect(data.name).toBe('Ada');
  });

  it('retains the combined environment size limit across referenced roots', () => {
    const ui = {
      type: 'Label',
      text: 'Static',
      $dynamic: { text: { template: '{data[0]} {external.first}' } },
    } as unknown as UISchemaElement;
    const data = Array.from({ length: 6_000 }, () => 'x');
    const external = Object.fromEntries(
      Array.from({ length: 5_000 }, (_, index) => [
        index === 0 ? 'first' : `key${index}`,
        'y',
      ]),
    );
    expect(resolveDynamicUi(ui, { data, path: '', external }).failures).toEqual(
      ['invalid environment'],
    );
  });

  it('does not invoke accessor descriptors while finding referenced roots', () => {
    let calls = 0;
    const descriptor = Object.defineProperty({}, 'bind', {
      enumerable: true,
      get() {
        calls++;
        return 'external.name';
      },
    });
    const ui = {
      type: 'Control',
      scope: '#/properties/name',
      label: 'Static',
      $dynamic: { label: descriptor },
    } as unknown as UISchemaElement;
    expect(
      resolveDynamicUi(ui, {
        data: {},
        path: '',
        external: { name: 'Unsafe' },
      }),
    ).toMatchObject({
      element: { label: 'Static' },
      failures: ['rule 0: invalid target label'],
    });
    expect(calls).toBe(0);
  });

  it('rebuilds a filtered configuration snapshot after replacement', () => {
    const ui = {
      type: 'Control',
      scope: '#/properties/name',
      label: 'Static',
      $dynamic: {
        label: { bind: 'config.label' },
        options: { hidden: { bind: 'config.jsonformsExtended.secret' } },
      },
    } as unknown as UISchemaElement;
    const first = resolveDynamicUi(ui, {
      data: {},
      path: '',
      config: { label: 'First', jsonformsExtended: { secret: true } },
    });
    const second = resolveDynamicUi(ui, {
      data: {},
      path: '',
      config: { label: 'Second', jsonformsExtended: { secret: false } },
    });
    expect(first.element).toMatchObject({ label: 'First' });
    expect(second.element).toMatchObject({ label: 'Second' });
    expect(first.element).not.toHaveProperty('options.hidden');
    expect(second.element).not.toHaveProperty('options.hidden');
  });

  it('exposes the core error array to CEL collection functions', () => {
    const ui = {
      type: 'Label',
      text: 'No core errors',
      $dynamic: {
        text: {
          expression:
            "size(errors) > 0 ? 'Core errors present' : 'No core errors'",
        },
      },
    } as unknown as UISchemaElement;
    expect(
      resolveDynamicUi(ui, { data: {}, path: '', errors: [] }).element,
    ).toMatchObject({
      text: 'No core errors',
    });
    expect(
      resolveDynamicUi(ui, {
        data: {},
        path: '',
        errors: [{ keyword: 'required' }],
      }).element,
    ).toMatchObject({ text: 'Core errors present' });
  });

  it('reselects from the authored element on every settings snapshot', () => {
    const before = structuredClone(authored);
    const memoizeResult = createDynamicUiMemo();
    const automatic = memoizeResult(
      resolveDynamicUi(
        authored,
        input({
          label: 'Subscription plan',
          readonly: false,
          presentation: 'automatic',
        }),
      ),
    );
    expect(automatic.failures).toEqual([]);
    expect(automatic.element).toMatchObject({
      label: 'Subscription plan',
      options: { readonly: false },
    });
    const radio = memoizeResult(
      resolveDynamicUi(
        authored,
        input({
          label: 'Subscription plan',
          readonly: true,
          presentation: 'radio',
        }),
      ),
    );
    expect(radio.element).toMatchObject({
      options: { readonly: true, format: 'radio' },
    });
    const restored = memoizeResult(
      resolveDynamicUi(
        authored,
        input({
          label: 'Subscription plan',
          readonly: false,
          presentation: 'automatic',
        }),
      ),
    );
    expect(
      (restored.element as { options?: { format?: string } }).options?.format,
    ).toBeUndefined();
    expect(
      memoizeResult(
        resolveDynamicUi(
          authored,
          input({
            label: 'Subscription plan',
            readonly: false,
            presentation: 'automatic',
          }),
        ),
      ).element,
    ).toBe(restored.element);
    expect(authored).toEqual(before);
  });

  it('preserves the current evaluation fallback while merging any UI-element key', () => {
    const ui = {
      type: 'Control',
      scope: '#/properties/name',
      label: 'Static',
      $dynamic: [
        { overlay: { label: 'First' } },
        {
          overlay: {
            label: { bind: 'external.missing' },
            scope: '#/properties/other',
            options: { readonly: false },
          },
        },
      ],
    } as unknown as UISchemaElement;
    const result = resolveDynamicUi(ui, { data: {}, path: '', external: {} });
    expect(result.element).toMatchObject({
      label: 'First',
      scope: '#/properties/other',
      options: { readonly: false },
    });
    expect(result.failures).toHaveLength(1);
  });

  it('uses own keys, quoted paths and restricted templates', () => {
    expect(
      dynamicPath("external['field.with.dots']", {
        external: { 'field.with.dots': 5 },
      }),
    ).toBe(5);
    expect(() =>
      dynamicPath('external.constructor', { external: {} }),
    ).toThrow();
    const ui = {
      type: 'ImageView',
      src: '/default.svg',
      alt: 'Logo',
      $dynamic: {
        src: { template: '/assets/{external.brand}.svg' },
      },
    } as unknown as UISchemaElement;
    expect(
      resolveDynamicUi(ui, { data: {}, path: '', external: { brand: 'blue' } })
        .element,
    ).toMatchObject({ src: '/assets/blue.svg' });
    expect(
      resolveDynamicUi(ui, { data: {}, path: '', external: {} }).element,
    ).toMatchObject({
      src: '/default.svg',
    });
    const quotedBrace = {
      ...ui,
      $dynamic: {
        src: { template: "/assets/{external['key}with.brace']}.svg" },
      },
    } as unknown as UISchemaElement;
    expect(
      resolveDynamicUi(quotedBrace, {
        data: {},
        path: '',
        external: { 'key}with.brace': 'blue' },
      }).element,
    ).toMatchObject({ src: '/assets/blue.svg' });
  });

  it('passes unknown element fields and deeply merged extension options to their renderer', () => {
    const ui = {
      type: 'Control',
      scope: '#/properties/name',
      options: { custom: { theme: 'plain', keep: 1 }, choices: ['old'] },
      $dynamic: [
        {
          overlay: {
            extensionFlag: { bind: 'external.flag' },
            options: {
              custom: { theme: { bind: 'external.theme' } },
              choices: [{ bind: 'external.choice' }, 'other'],
            },
          },
        },
        { overlay: { options: { custom: { keep: 2 } } } },
      ],
    } as unknown as UISchemaElement;
    const result = resolveDynamicUi(ui, {
      data: {},
      path: '',
      external: { flag: false, theme: 'dark', choice: 'new' },
    });
    expect(result.failures).toEqual([]);
    expect(result.element).toMatchObject({
      extensionFlag: false,
      options: {
        custom: { theme: 'dark', keep: 2 },
        choices: ['new', 'other'],
      },
    });
    expect(
      (ui as unknown as { options: { custom: { theme: string } } }).options
        .custom.theme,
    ).toBe('plain');
  });

  it('leaves UI-element value contracts to the renderer and rejects unsafe payloads', () => {
    const unsafe = JSON.parse('{"__proto__":{"polluted":true}}');
    const ui = {
      type: 'Control',
      scope: '#',
      $dynamic: {
        label: 12,
        options: { readonly: 'yes', custom: unsafe },
        custom: () => 1,
      },
    } as unknown as UISchemaElement;
    const result = resolveDynamicUi(ui, { data: {}, path: '' });
    expect(result.element).toMatchObject({
      label: 12,
      options: { readonly: 'yes' },
    });
    expect(result.failures).toHaveLength(2);
    expect(result.element).not.toHaveProperty('custom');
    expect(Object.prototype).not.toHaveProperty('polluted');
  });

  it('can replace structural fields while preserving nested elements own descriptors', () => {
    const ui = {
      type: 'VerticalLayout',
      elements: [{ type: 'Control', scope: '#/properties/old' }],
      $dynamic: {
        type: { bind: 'external.layoutType' },
        rule: {
          effect: 'SHOW',
          condition: { scope: '#', schema: { const: true } },
        },
        elements: [
          {
            type: 'Control',
            scope: '#/properties/new',
            $dynamic: { label: { bind: 'external.childLabel' } },
          },
        ],
      },
    } as unknown as UISchemaElement;
    const result = resolveDynamicUi(ui, {
      data: {},
      path: '',
      external: { layoutType: 'HorizontalLayout', childLabel: 'Later' },
    });
    expect(result.failures).toEqual([]);
    expect(result.element).toMatchObject({
      type: 'HorizontalLayout',
      rule: { effect: 'SHOW', condition: { schema: { const: true } } },
      elements: [
        {
          type: 'Control',
          scope: '#/properties/new',
          $dynamic: { label: { bind: 'external.childLabel' } },
        },
      ],
    });
    expect(result.element).not.toHaveProperty('$dynamic');
  });

  it('rejects a cyclic extension value without losing a valid sibling', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    const ui = {
      type: 'Control',
      scope: '#',
      $dynamic: { label: 'Updated', custom: cyclic },
    } as unknown as UISchemaElement;
    const result = resolveDynamicUi(ui, { data: {}, path: '' });
    expect(result.element).toMatchObject({ label: 'Updated' });
    expect(result.element).not.toHaveProperty('custom');
    expect(result.failures).toHaveLength(1);
  });

  it('keeps an earlier array when any replacement entry fails', () => {
    const ui = {
      type: 'Control',
      scope: '#',
      options: { customChoices: ['static'] },
      $dynamic: [
        { overlay: { options: { customChoices: ['first', 'second'] } } },
        {
          overlay: {
            options: { customChoices: ['third', { bind: 'external.missing' }] },
          },
        },
      ],
    } as unknown as UISchemaElement;
    const result = resolveDynamicUi(ui, { data: {}, path: '', external: {} });
    expect(result.element).toMatchObject({
      options: { customChoices: ['first', 'second'] },
    });
    expect(result.failures).toHaveLength(1);
  });

  it('converts safe CEL integers to JSON numbers and rejects out-of-range values', () => {
    const ui = {
      type: 'ImageView',
      options: { width: 200 },
      $dynamic: [
        {
          overlay: {
            options: { width: { expression: 'external.compact ? 100 : 200' } },
          },
        },
        {
          overlay: { options: { height: { expression: '9007199254740992' } } },
        },
      ],
    } as unknown as UISchemaElement;
    const result = resolveDynamicUi(ui, {
      data: {},
      path: '',
      external: { compact: true },
    });
    expect(result.element).toMatchObject({ options: { width: 100 } });
    expect(
      (result.element as { options: { height?: number } }).options.height,
    ).toBeUndefined();
    expect(result.failures).toHaveLength(1);
    const restored = resolveDynamicUi(ui, {
      data: {},
      path: '',
      external: { compact: false },
    });
    expect(restored.element).toMatchObject({ options: { width: 200 } });
    const layout = {
      type: 'VerticalLayout',
      options: { gap: 24 },
      $dynamic: {
        options: { gap: { expression: 'external.settings.compact ? 8 : 24' } },
      },
    } as unknown as UISchemaElement;
    expect(
      resolveDynamicUi(layout, {
        data: {},
        path: '',
        external: { settings: { compact: true } },
      }).element,
    ).toMatchObject({ options: { gap: 8 } });
  });

  it('escapes descriptor-shaped literal data without evaluating it', () => {
    const ui = {
      type: 'Control',
      scope: '#',
      $dynamic: {
        extension: { literal: { bind: 'ordinary data' } },
        options: { choices: [{ literal: { expression: 'ordinary data' } }] },
      },
    } as unknown as UISchemaElement;
    const result = resolveDynamicUi(ui, { data: {}, path: '' });
    expect(result.failures).toEqual([]);
    expect(result.element).toMatchObject({
      extension: { bind: 'ordinary data' },
      options: { choices: [{ expression: 'ordinary data' }] },
    });
  });

  it('admits only explicitly enabled synchronous trusted function leaves', () => {
    const ui = {
      type: 'Control',
      scope: '#',
      label: 'Static',
      $dynamic: [
        {
          when: (environment: { item: { name: string } }) =>
            environment.item.name === 'first',
          overlay: {
            label: (environment: { item: { name: string } }) =>
              environment.item.name,
            options: {
              count: (environment: { errors: unknown[] }) =>
                environment.errors.length,
            },
          },
        },
      ],
    } as unknown as UISchemaElement;
    const input = {
      data: {},
      item: { name: 'first' },
      errors: [{ keyword: 'required' }],
      path: '',
    };
    expect(resolveDynamicUi(ui, input).element).toMatchObject({
      label: 'Static',
    });
    const enabled = resolveDynamicUi(ui, { ...input, trustedFunctions: true });
    expect(enabled.failures).toEqual([]);
    expect(enabled.element).toMatchObject({
      label: 'first',
      options: { count: 1 },
    });
    const asyncUi = {
      type: 'Control',
      scope: '#',
      $dynamic: { label: async () => 'late' },
    } as unknown as UISchemaElement;
    expect(
      resolveDynamicUi(asyncUi, { ...input, trustedFunctions: true }).failures,
    ).toHaveLength(1);
  });

  it('keeps conditions to booleans, CEL expressions, and trusted functions', () => {
    const ui = {
      type: 'Control',
      scope: '#',
      label: 'Static',
      $dynamic: [
        {
          when: { bind: 'external.enabled' },
          overlay: { label: 'Unexpected' },
        },
        { when: true, overlay: { label: 'Allowed' } },
      ],
    } as unknown as UISchemaElement;
    const result = resolveDynamicUi(ui, {
      data: {},
      path: '',
      external: { enabled: true },
    });
    expect(result.element).toMatchObject({ label: 'Allowed' });
    expect(result.failures).toHaveLength(1);
  });

  it('does not invoke configuration getters while constructing the environment', () => {
    let calls = 0;
    const config = Object.defineProperty({}, 'unsafe', {
      enumerable: true,
      get() {
        calls++;
        return 'secret';
      },
    });
    const ui = {
      type: 'Control',
      scope: '#',
      label: 'Static',
      $dynamic: { label: { bind: 'config.unsafe' } },
    } as unknown as UISchemaElement;
    const result = resolveDynamicUi(ui, { data: {}, path: '', config });
    expect(calls).toBe(0);
    expect(result.element).toMatchObject({ label: 'Static' });
    expect(result.failures).toEqual(['invalid environment']);
  });
});

it('preserves child metadata in object and array slots until child dispatch', () => {
  const child = {
    type: 'Control',
    scope: '#',
    $dynamic: { label: { bind: 'item.name' } },
  };
  const parent = {
    type: 'VerticalLayout',
    $dynamic: { elements: [child], options: { detail: child } },
  };
  const result = resolveDynamicUi(parent, {
    data: {},
    path: '',
    item: { name: 'Parent' },
  });
  expect(result.failures).toEqual([]);
  const element = result.element as typeof parent & {
    elements: (typeof child)[];
    options: { detail: typeof child };
  };
  expect(element.elements[0]).toEqual(child);
  expect(element.options.detail).toEqual(child);
  expect(
    resolveDynamicUi(element.options.detail, {
      data: {},
      path: '',
      item: { name: 'Child' },
    }).element,
  ).toMatchObject({ label: 'Child' });
});

it('retains trusted child functions without executing them in the parent', () => {
  let calls = 0;
  const child = {
    type: 'Control',
    $dynamic: {
      label: () => {
        calls++;
        return 'Child';
      },
    },
  };
  const parent = {
    type: 'VerticalLayout',
    $dynamic: { elements: [child], options: { detail: child } },
  };
  const result = resolveDynamicUi(parent, {
    data: {},
    path: '',
    trustedFunctions: true,
  });
  expect(result.failures).toEqual([]);
  expect(calls).toBe(0);
  const detail = result.element.options!.detail;
  expect(
    resolveDynamicUi(detail, { data: {}, path: '', trustedFunctions: true })
      .element,
  ).toMatchObject({ label: 'Child' });
  expect(calls).toBe(1);
});

it('does not read unused roots or descendant-only dependencies', () => {
  const parent = {
    type: 'Control',
    $dynamic: {
      options: {
        detail: { type: 'Control', $dynamic: { label: { bind: 'data.name' } } },
      },
    },
  };
  expect(
    resolveDynamicUi(parent, {
      get data() {
        throw Error('parent must not read data');
      },
      path: '',
    }).failures,
  ).toEqual([]);
});

it('rejects indexed environment and overlay getters without executing them', () => {
  let calls = 0;
  const array = Object.defineProperty([], '0', {
    enumerable: true,
    get() {
      calls++;
      return 'unsafe';
    },
  });
  expect(
    resolveDynamicUi(
      {
        type: 'Control',
        $dynamic: { label: { bind: 'external.values[0]' } },
      } as UISchemaElement,
      { data: {}, path: '', external: { values: array } },
    ).failures,
  ).toEqual(['invalid environment']);
  expect(
    resolveDynamicUi(
      {
        type: 'Control',
        $dynamic: { options: { values: array } },
      } as UISchemaElement,
      { data: {}, path: '' },
    ).failures.length,
  ).toBeGreaterThan(0);
  expect(calls).toBe(0);
});

it('caches evaluation for unchanged referenced roots and isolates occurrences', () => {
  const first = createDynamicUiResolver();
  const second = createDynamicUiResolver();
  const element = {
    type: 'Control',
    $dynamic: { label: { bind: 'external.label' } },
  };
  const external = { label: 'First' };
  const result = first(element, { data: {}, path: '', external });
  expect(
    first(element, {
      get data() {
        throw Error('unused data');
      },
      path: '',
      external,
    }),
  ).toBe(result);
  expect(
    second(element, { data: {}, path: '', external: { label: 'Second' } })
      .element,
  ).toMatchObject({ label: 'Second' });
  expect(
    first(element, { data: {}, path: '', external: { label: 'Changed' } })
      .element,
  ).toMatchObject({ label: 'Changed' });
});

it('shares unchanged overlaid children when another effective field changes', () => {
  const resolve = createDynamicUiResolver();
  const ui = {
    type: 'VerticalLayout',
    $dynamic: {
      label: { bind: 'external.label' },
      elements: [{ type: 'Control', scope: '#' }],
    },
  };
  const first = resolve(ui, {
    data: {},
    path: '',
    external: { label: 'First' },
  }).element as UISchemaElement & { elements: unknown[] };
  const next = resolve(ui, { data: {}, path: '', external: { label: 'Next' } })
    .element as UISchemaElement & { elements: unknown[] };
  expect(next).not.toBe(first);
  expect(next.elements).toBe(first.elements);
});

it('atomically replaces condition shapes and rejects incomplete resolution without partial writes', () => {
  const original = { type: 'AND', conditions: [] };
  const ui = {
    type: 'Control',
    rule: { effect: 'HIDE', condition: original },
    $dynamic: {
      rule: {
        condition: {
          bind: 'external.condition',
        },
      },
    },
  } as unknown as UISchemaElement;
  const good = resolveDynamicUi(ui, {
    data: {},
    path: '',
    external: {
      condition: { scope: '#/properties/name', schema: { const: 'Ada' } },
    },
  });
  expect(good.failures).toEqual([]);
  expect(good.element.rule?.condition).toEqual({
    scope: '#/properties/name',
    schema: { const: 'Ada' },
  });
  const bad = resolveDynamicUi(ui, { data: {}, path: '', external: {} });
  expect(bad.failures.length).toBeGreaterThan(0);
  expect(bad.element.rule?.condition).toEqual(original);
});

it('distinguishes CEL missing members, null and empty text', () => {
  const ui = {
    type: 'Label',
    text: 'fallback',
    $dynamic: {
      text: {
        expression:
          "has(data.name) ? (data.name == null ? 'null' : data.name) : 'absent'",
      },
    },
  } as UISchemaElement;
  for (const [data, text] of [
    [{}, 'absent'],
    [{ name: null }, 'null'],
    [{ name: '' }, ''],
  ]) {
    expect(resolveDynamicUi(ui, { data, path: '' }).element).toMatchObject({
      text,
    });
  }
});

it('literal objects replace the target without interpreting payloads and preserve child dynamic ownership', () => {
  const child = {
    type: 'Label',
    text: 'fallback',
    $dynamic: { text: { bind: 'item.name' } },
  };
  const ui = {
    type: 'Control',
    options: { detail: { type: 'Group', label: 'obsolete' } },
    $dynamic: {
      options: {
        detail: {
          literal: {
            type: 'VerticalLayout',
            elements: [child],
            options: { custom: { bind: 'ordinary data' } },
          },
        },
      },
    },
  } as unknown as UISchemaElement;
  const result = resolveDynamicUi(ui, { data: {}, path: '' });
  expect(result.failures).toEqual([]);
  expect(result.element.options?.detail).toEqual({
    type: 'VerticalLayout',
    elements: [child],
    options: { custom: { bind: 'ordinary data' } },
  });
  expect(
    resolveDynamicUi(result.element.options?.detail.elements[0], {
      data: {},
      path: 'members.1',
      item: { name: 'Grace' },
    }).element,
  ).toMatchObject({ text: 'Grace' });
});

it('patches authored objects but installs descriptor object results as complete values', () => {
  const complete = { readonly: true };
  for (const descriptor of [
    { literal: complete },
    { bind: 'external.options' },
    { expression: "{'readonly': true}" },
    () => complete,
  ]) {
    const ui = {
      type: 'Control',
      options: { readonly: false, format: 'radio' },
      $dynamic: { options: descriptor },
    } as unknown as UISchemaElement;
    const result = resolveDynamicUi(ui, {
      data: {},
      path: '',
      external: { options: complete },
      trustedFunctions: true,
    });
    expect(result.failures).toEqual([]);
    expect(result.element.options).toEqual(complete);
  }
  const patch = {
    type: 'Control',
    options: { readonly: false, format: 'radio' },
    $dynamic: { options: { readonly: { literal: true } } },
  } as unknown as UISchemaElement;
  expect(
    resolveDynamicUi(patch, { data: {}, path: '' }).element.options,
  ).toEqual({ readonly: true, format: 'radio' });
});

it('treats replace as ordinary extension data, not a descriptor', () => {
  const ui = {
    type: 'Control',
    $dynamic: { options: { custom: { replace: 'data' } } },
  } as unknown as UISchemaElement;
  expect(resolveDynamicUi(ui, { data: {}, path: '' }).element.options).toEqual({
    custom: { replace: 'data' },
  });
});

it('derives the nearest array item without treating numeric object keys as arrays', async () => {
  const { dynamicItemAt } = await import('../src/dynamicUi');
  const child = { name: 'Nested' };
  const parent = { name: 'Parent', children: [child] };
  const data = { people: [parent], keyed: { '0': { name: 'Object' } } };
  expect(dynamicItemAt(data, ['people', '0', 'name'])).toBe(parent);
  expect(dynamicItemAt(data, ['people', '0', 'children', '0', 'name'])).toBe(
    child,
  );
  expect(dynamicItemAt(data, ['keyed', '0', 'name'])).toBeUndefined();
  expect(dynamicItemAt(data, [])).toBeUndefined();
});

it('shares pure resolution within one form without crossing input or form boundaries', async () => {
  const { createDynamicUiCache } = await import('../src/dynamicUi');
  let calls = 0;
  const ui = {
    type: 'Label',
    $dynamic: {
      text: ({ item, path }: any) => {
        calls++;
        return `${item.name}:${path}`;
      },
    },
  } as unknown as UISchemaElement;
  const cache = createDynamicUiCache();
  const parent = createDynamicUiResolver(cache);
  const child = createDynamicUiResolver(cache);
  const item = { name: 'First' };
  const input = { data: {}, item, path: 'rows.0', trustedFunctions: true };
  expect(parent(ui, input).element).toMatchObject({ text: 'First:rows.0' });
  expect(child(ui, input).element).toMatchObject({ text: 'First:rows.0' });
  expect(calls).toBe(1);
  expect(
    child(ui, { ...input, item: { name: 'Second' }, path: 'rows.1' }).element,
  ).toMatchObject({ text: 'Second:rows.1' });
  expect(calls).toBe(2);
  const otherForm = createDynamicUiResolver(createDynamicUiCache());
  otherForm(ui, input);
  expect(calls).toBe(3);
  const disabled = child(ui, { ...input, trustedFunctions: false });
  expect(disabled.failures.length).toBeGreaterThan(0);
  expect(calls).toBe(3);
  expect(parent(ui, input).element).toMatchObject({ text: 'First:rows.0' });
});

it('reuses shared results without resetting occurrence-local element identity', async () => {
  const { createDynamicUiCache } = await import('../src/dynamicUi');
  const cache = createDynamicUiCache();
  const first = createDynamicUiResolver(cache);
  const second = createDynamicUiResolver(cache);
  const ui = {
    type: 'Label',
    $dynamic: { text: { bind: 'external.label' } },
  } as unknown as UISchemaElement;
  const one = { data: {}, path: '', external: { label: 'Same' } };
  const a = first(ui, one).element;
  const b = second(ui, one).element;
  const two = { ...one, external: { label: 'Same' } };
  expect(first(ui, two).element).toBe(a);
  expect(second(ui, two).element).toBe(b);
  // Referenced-root invalidation must not become authored-element-only reuse.
  expect(
    first(ui, { ...one, external: { label: 'Changed' } }).element,
  ).toMatchObject({ text: 'Changed' });
});
