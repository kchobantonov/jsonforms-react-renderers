import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import Ajv from 'ajv';

/**
 * The authoring schemas in `docs/schemas`, checked against reality.
 *
 * A hand-written schema of a hand-written surface rots the moment an option is
 * added, and a rotted one is worse than none: it rejects valid documents and
 * so teaches authors to ignore it. These tests are the thing that keeps it
 * honest - every fixture in the repository has to validate.
 */

const schemaDir = join(__dirname, '../../../docs/schemas');
const specDir = join(
  __dirname,
  '../../jsonforms-react-demo-common/src/examples/spec'
);

const load = (name: string) =>
  JSON.parse(readFileSync(join(schemaDir, name), 'utf8'));

/*
  `strict: false` because these schemas carry `examples` and prose next to
  keywords Ajv's strict mode would rather not see together. They describe a
  surface for authors, not a validator contract.
*/
/*
  The extended config schema `$ref`s the base one by filename rather than
  restating it, so the base has to be registered under exactly that key before
  anything referencing it will compile.
*/
const BASE_CONFIG = 'jsonforms-config.schema.json';
const EXTENDED_CONFIG = 'jsonforms-extended-config.schema.json';
const BASE_UISCHEMA = 'jsonforms-uischema.schema.json';
const EXTENDED_UISCHEMA = 'jsonforms-extended-uischema.schema.json';

const ajvWithConfigSchemas = () => {
  const ajv = new Ajv({ strict: false, allErrors: true });
  ajv.addSchema(load(BASE_CONFIG), BASE_CONFIG);
  ajv.addSchema(load(BASE_UISCHEMA), BASE_UISCHEMA);
  return ajv;
};

const compile = (name: string) =>
  name === BASE_CONFIG || name === BASE_UISCHEMA
    ? new Ajv({ strict: false, allErrors: true }).compile(load(name))
    : ajvWithConfigSchemas().compile(load(name));

const uiSchemasIn = (dir: string) =>
  readdirSync(specDir)
    .map((example) => join(specDir, example, dir))
    .filter(existsSync);

/**
 * Examples that author something invalid on purpose, to show what a renderer
 * does with it.
 *
 * Listed with the error the schema **must** raise, so being on this list
 * asserts the catch rather than waiving it: an example drops off the sweep
 * only by proving the schema notices it.
 */
const DELIBERATELY_INVALID: Record<string, RegExp> = {
  // A Label asking for a markup language this renderer set does not
  // implement, so the example can show the diagnostic beside the text.
  'markup-label': /options\/markup must be equal to one of the allowed values/,
};

const exampleIdOf = (file: string) => basename(dirname(file));

describe('the schemas themselves', () => {
  it.each([BASE_CONFIG, EXTENDED_CONFIG, BASE_UISCHEMA, EXTENDED_UISCHEMA])(
    '%s compiles',
    (name) => {
      expect(() => compile(name)).not.toThrow();
    }
  );
});

describe('every UI schema in the repository', () => {
  /*
    The whole point. If an example stops validating, either the example is
    wrong or the schema has fallen behind the code - and the second is much
    more likely.
  */
  it('validates against the full schema', () => {
    const ajv = ajvWithConfigSchemas();
    const validate = ajv.compile(load(EXTENDED_UISCHEMA));
    const failures: string[] = [];
    for (const file of uiSchemasIn('uischema.json')) {
      const expected = DELIBERATELY_INVALID[exampleIdOf(file)];
      const ok = validate(JSON.parse(readFileSync(file, 'utf8')));
      const errors = ajv.errorsText(validate.errors);
      if (expected) {
        if (ok) {
          failures.push(
            `${file}: expected the schema to reject this, and it did not`
          );
        } else if (!expected.test(errors)) {
          failures.push(`${file}: rejected for the wrong reason: ${errors}`);
        }
      } else if (!ok) {
        failures.push(`${file}: ${errors}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('validates at least a dozen of them, so the sweep is not empty', () => {
    expect(uiSchemasIn('uischema.json').length).toBeGreaterThan(12);
  });
});

describe('every config in the repository', () => {
  /*
    Validated against the **extended** schema, because the examples exercise
    both renderer sets. The base schema is the narrower one and is checked for
    the superset relationship below rather than against these fixtures.
  */
  it('validates against the extended config schema', () => {
    const ajv = ajvWithConfigSchemas();
    const validate = ajv.compile(load('jsonforms-extended-config.schema.json'));
    const failures: string[] = [];
    for (const file of uiSchemasIn('config.json')) {
      if (!validate(JSON.parse(readFileSync(file, 'utf8')))) {
        failures.push(`${file}: ${ajv.errorsText(validate.errors)}`);
      }
    }
    expect(failures).toEqual([]);
  });
});

describe('the two config schemas', () => {
  /*
    The split mirrors the package layering: the base file is what a host on
    core plus the antd renderer set can author, and the extended file adds what
    the framework-agnostic extended renderers and their antd bindings read.

    The extended file **references** the base rather than restating it. That is
    the property worth protecting: a duplicated key is a key that will
    eventually disagree with its twin, and nothing would report it.
  */
  const base = load('jsonforms-config.schema.json');
  const extended = load('jsonforms-extended-config.schema.json');

  it('restates nothing from the base', () => {
    // No top-level properties of its own at all - they arrive through the ref.
    expect(Object.keys(extended.properties ?? {})).toEqual([]);

    const baseNamespaced = Object.keys(base.$defs.extended.properties);
    const restated = Object.keys(extended.$defs.extendedOnly.properties).filter(
      (key) => baseNamespaced.includes(key)
    );
    expect(restated).toEqual([]);
  });

  it('references the base file rather than copying it', () => {
    const refs = JSON.stringify(extended).match(/"\$ref":"[^"]+"/g) ?? [];
    expect(refs.some((ref) => ref.includes(BASE_CONFIG))).toBe(true);
  });

  it('still accepts everything the base accepts', () => {
    const validate = ajvWithConfigSchemas().compile(extended);
    expect(
      validate({
        restrict: false,
        hideRequiredAsterisk: true,
        dateSaveFormat: 'YYYY-MM-DD',
        jsonformsExtended: {
          layoutDefaults: { gap: 8, gridColumns: 12 },
          confirmation: { default: 'never' },
          showValidationIndicator: true,
        },
      })
    ).toBe(true);
  });

  it('adds what only the extended renderers read', () => {
    const validate = ajvWithConfigSchemas().compile(extended);
    expect(
      validate({
        jsonformsExtended: {
          security: {
            allowScriptEvaluation: false,
            urlPolicy: { allowedSchemes: ['https'], allowRelative: true },
          },
          defaultTemplateLang: 'ractive',
          propagateErrors: true,
          colorSaveFormat: 'hex',
        },
      })
    ).toBe(true);
  });

  /*
    And the base does not describe them. A host on the antd set alone would
    otherwise get completion for options nothing in its build consumes.
  */
  it('keeps extended-only options out of the base', () => {
    const extendedOnly = [
      'security',
      'defaultTemplateLang',
      'propagateErrors',
      'colorTextEntry',
      'colorSaveFormat',
      'agGridOptions',
      'monaco',
    ];
    const leaked = extendedOnly.filter(
      (key) => key in base.$defs.extended.properties
    );
    expect(leaked).toEqual([]);
  });

  it('carries the options the antd set actually reads', () => {
    for (const key of [
      'layoutDefaults',
      'confirmation',
      'showValidationIndicator',
      'showDataIndicator',
      'collapsible',
      'restrict',
    ]) {
      expect(base.$defs.extended.properties, key).toHaveProperty(key);
    }
  });
});

describe('the reference is load-bearing', () => {
  it('cannot compile without the base registered', () => {
    const ajv = new Ajv({ strict: false });
    expect(() => ajv.compile(load(EXTENDED_CONFIG))).toThrow();
  });

  it('enforces a base constraint through the reference', () => {
    const ajv = new Ajv({ strict: false, allErrors: true });
    ajv.addSchema(load(BASE_CONFIG), BASE_CONFIG);
    const validate = ajv.compile(load(EXTENDED_CONFIG));
    // `restrict` is typed boolean in the BASE file only.
    expect(validate({ restrict: 'yes' })).toBe(false);
    expect(validate({ restrict: true })).toBe(true);
    // `gridColumns` minimum lives in the base's layoutDefaults.
    expect(
      validate({ jsonformsExtended: { layoutDefaults: { gridColumns: 0 } } })
    ).toBe(false);
  });

  it('enforces an extended-only constraint too', () => {
    const ajv = new Ajv({ strict: false, allErrors: true });
    ajv.addSchema(load(BASE_CONFIG), BASE_CONFIG);
    const validate = ajv.compile(load(EXTENDED_CONFIG));
    expect(
      validate({ jsonformsExtended: { colorSaveFormat: 'not-a-format' } })
    ).toBe(false);
    expect(validate({ jsonformsExtended: { colorSaveFormat: 'hex' } })).toBe(
      true
    );
  });

  it('the base alone does not know the extended options', () => {
    const ajv = new Ajv({ strict: false, allErrors: true });
    const validate = ajv.compile(load(BASE_CONFIG));
    // Open by design, so it accepts them - but describes nothing.
    expect(validate({ jsonformsExtended: { colorSaveFormat: 'hex' } })).toBe(
      true
    );
    expect(
      'colorSaveFormat' in load(BASE_CONFIG).$defs.extended.properties
    ).toBe(false);
  });
});

describe('the antd subset', () => {
  const antd = () => compile(BASE_UISCHEMA);

  /* It has to actually refuse something, or it is not a subset. */
  it('refuses an element only the extended set registers', () => {
    const validate = antd();
    expect(validate({ type: 'Button', label: 'Go', action: 'go' })).toBe(false);
    expect(
      validate({
        type: 'TemplateLayout',
        template: '<p>x</p>',
        elements: [],
      })
    ).toBe(false);
  });

  /*
    `options.format` is a renderer-selection hint, not an enumeration - the
    fixtures alone use radio, date, date-time, time - so the subset cannot
    close it. Excluding the three values only the extended set answers to is
    as much as a schema can honestly enforce.
  */
  it('refuses the formats only the extended set can render', () => {
    const validate = antd();
    for (const format of ['code', 'duration', 'color']) {
      expect(
        validate({
          type: 'Control',
          scope: '#/properties/a',
          options: { format },
        }),
        format
      ).toBe(false);
    }
  });

  it('leaves the open format hint open', () => {
    const validate = antd();
    for (const format of ['password', 'radio', 'date-time', 'table']) {
      expect(
        validate({
          type: 'Control',
          scope: '#/properties/a',
          options: { format },
        }),
        format
      ).toBe(true);
    }
  });

  /*
    A detail may be written without a `type` - JSON Forms reads a bare
    `{ elements: [...] }` as a vertical layout, and three fixtures do. The
    alternatives overlap, so the schema uses `anyOf`; `oneOf` called a typed
    detail ambiguous and rejected it.
  */
  it('accepts a detail with or without a type', () => {
    const validate = antd();
    for (const detail of [
      { elements: [{ type: 'Control', scope: '#/properties/b' }] },
      {
        type: 'VerticalLayout',
        elements: [{ type: 'Control', scope: '#/properties/b' }],
      },
      'GENERATE',
    ]) {
      expect(
        validate({
          type: 'Control',
          scope: '#/properties/a',
          options: { detail },
        }),
        JSON.stringify(detail)
      ).toBe(true);
    }
  });

  /* And it must still accept what the base set does render. */
  it('accepts the base elements', () => {
    const validate = antd();
    for (const element of [
      { type: 'Control', scope: '#/properties/a' },
      { type: 'VerticalLayout', elements: [] },
      { type: 'Group', label: 'G', elements: [] },
      { type: 'Categorization', elements: [] },
      { type: 'Label', text: 'x' },
      { type: 'ListWithDetail', scope: '#/properties/a' },
    ]) {
      expect(validate(element), JSON.stringify(element)).toBe(true);
    }
  });
});

describe('`views` matches what the code actually reads', () => {
  /*
    `datePickerMode` reads the date views and `timePickerColumns` the time
    ones, and both ignore anything else - so an unconstrained string array let
    a typo through to a picker that quietly kept its defaults, which is exactly
    the silent failure these schemas exist to catch.
  */
  const viewsOf = (schema: any): any => {
    let found: any;
    const walk = (node: any) => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (node && typeof node === 'object') {
        if (node.views?.type === 'array') found = node.views;
        Object.values(node).forEach(walk);
      }
    };
    walk(schema);
    return found;
  };

  it.each([BASE_CONFIG, BASE_UISCHEMA, EXTENDED_UISCHEMA])(
    '%s offers every view the code reads',
    (name) => {
      expect(viewsOf(load(name))?.items?.enum).toEqual([
        'year',
        'month',
        'day',
        'hours',
        'minutes',
        'seconds',
      ]);
    }
  );

  it('rejects a misspelling', () => {
    const ajv = new Ajv({ strict: false, allErrors: true });
    const validate = ajv.compile(load(BASE_CONFIG));
    expect(validate({ views: ['year', 'hours'] })).toBe(true);
    expect(validate({ views: ['days'] })).toBe(false);
  });

  /*
    The UI schema narrows per control kind, which the config file cannot: a
    global default has no control in sight. The narrowing only reaches a
    control whose kind is stated in `options.format` - one selected by its data
    schema's format is invisible to a UI-schema validator, which is a limit
    worth stating rather than papering over.
  */
  describe('per control kind, in the UI schema', () => {
    const control = (format: string, views: string[]) => ({
      type: 'Control',
      scope: '#/properties/at',
      options: { format, views },
    });
    const validate = () =>
      new Ajv({ strict: false, allErrors: true }).compile(load(BASE_UISCHEMA));

    it('lets a date control ask for calendar views only', () => {
      const v = validate();
      expect(v(control('date', ['year', 'month']))).toBe(true);
      expect(v(control('date', ['hours']))).toBe(false);
    });

    it('lets a time control ask for time columns only', () => {
      const v = validate();
      expect(v(control('time', ['hours', 'minutes']))).toBe(true);
      expect(v(control('time', ['month']))).toBe(false);
    });

    it('lets a date-time control ask for both', () => {
      const v = validate();
      expect(v(control('date-time', ['year', 'day', 'hours', 'minutes']))).toBe(
        true
      );
    });

    it('leaves a control whose kind comes from the data schema alone', () => {
      const v = validate();
      expect(
        v({
          type: 'Control',
          scope: '#/properties/at',
          options: { views: ['hours'] },
        })
      ).toBe(true);
    });
  });
});

describe('the two UI schemas', () => {
  /*
    The pair mirrors the config pair, with one difference that is forced
    rather than chosen: a UI schema is a single mutually-recursive graph
    rooted at `element`, and the extended file has to **widen** that union.
    `allOf` intersects, so the config file's pure-reference trick cannot
    express it, and draft-07 has no other mechanism. What can be shared is
    shared by reference; the recursive spine is generated from the base, and
    these tests are what stop it drifting.
  */
  const base = load(BASE_UISCHEMA);
  const extended = load(EXTENDED_UISCHEMA);

  /*
    `label` is deliberately absent: it is the one definition the extended file
    both references and adds to, so it has its own test below.
  */
  const SHARED = [
    'confirmationOperations',
    'dimension',
    'layoutContainerOptions',
    'layoutItemOptions',
    'rule',
  ];

  /*
    The third shape, between "shared by reference" and "generated from the
    base": a definition the extended set adds options to. It must still be a
    wrapper over the base rather than a copy, or `text` and `options.format`
    acquire a second home and drift.
  */
  it('extends the base label by reference rather than restating it', () => {
    const label = extended.$defs.label;
    expect(label.allOf?.[0]?.$ref).toBe(`${BASE_UISCHEMA}#/$defs/label`);
    // Nothing the base already declares is repeated here.
    const added = label.allOf?.[1]?.properties ?? {};
    expect(Object.keys(added)).toEqual(['options']);
    expect(Object.keys(added.options.properties)).toEqual([
      'markup',
      'typography',
      'interpolate',
      'textParams',
    ]);
    expect(JSON.stringify(label)).not.toContain('"text"');
  });

  it('references the base for every definition that can be shared', () => {
    const text = JSON.stringify(extended);
    for (const name of SHARED) {
      // Referenced across the file boundary...
      expect(text, name).toContain(`${BASE_UISCHEMA}#/$defs/${name}`);
      // ...and not restated locally.
      expect(Object.keys(extended.$defs), name).not.toContain(name);
    }
  });

  /*
    The spine that cannot be shared must still be identical where it is not
    deliberately widened. `control`, `detail` and the layout shells carry no
    extended vocabulary of their own - only the element union and the option
    bag do - so any difference in them is drift.
  */
  it('keeps the unwidened spine identical to the base', () => {
    for (const name of ['control', 'detail', 'listWithDetail', 'category']) {
      expect(extended.$defs[name], name).toEqual(base.$defs[name]);
    }
  });

  /*
    The two files restrict `type` differently, and the asymmetry is the whole
    design. The base enumerates what its renderer set registers, so authoring
    an element it cannot draw is an error. The extended file leaves `type`
    open, because unknown elements must be preserved and ignored - a host may
    register more - and relies on its per-type branches instead.
  */
  it('restricts the element type in the base and leaves it open in the extended', () => {
    const baseTypes: string[] = base.$defs.element.properties.type.enum;
    expect(baseTypes.length).toBeGreaterThan(0);
    expect(extended.$defs.element.properties.type.enum).toBeUndefined();
  });

  it('covers every base element type, and more, in its per-type branches', () => {
    const typesIn = (schema: any): string[] =>
      (schema.$defs.byType.allOf ?? [])
        .map((branch: any) => branch.if?.properties?.type?.const)
        .filter(Boolean);
    const baseCovered = typesIn(base);
    const extCovered = typesIn(extended);
    expect(baseCovered.length).toBeGreaterThan(0);
    expect(baseCovered.every((t) => extCovered.includes(t))).toBe(true);
    expect(extCovered.length).toBeGreaterThan(baseCovered.length);
  });

  it('accepts an extended element nested inside a base layout', () => {
    const validate = ajvWithConfigSchemas().compile(extended);
    const doc = {
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/a' },
        { type: 'Button', label: 'Go', action: 'submit' },
      ],
    };
    expect(validate(doc), JSON.stringify(validate.errors)).toBe(true);
  });

  it('and the base refuses that same document', () => {
    const validate = new Ajv({ strict: false, allErrors: true }).compile(base);
    const doc = {
      type: 'VerticalLayout',
      elements: [{ type: 'Button', label: 'Go', action: 'submit' }],
    };
    expect(validate(doc)).toBe(false);
  });

  it('names no vendor and no renderer library', () => {
    for (const name of [
      BASE_CONFIG,
      EXTENDED_CONFIG,
      BASE_UISCHEMA,
      EXTENDED_UISCHEMA,
    ]) {
      const text = JSON.stringify(load(name)).toLowerCase();
      expect(text, name).not.toContain('jsonforms-react-renderers');
      expect(text, name).not.toContain('material');
    }
  });
});
