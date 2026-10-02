import { exampleElements } from './exampleElements';
import { describe, expect, test } from 'vitest';
import catalog from '@chobantonov/jsonforms-extended-spec/examples/catalog.json';
import examples, {
  SPEC_EXAMPLE_LABEL_PREFIX,
  SPEC_EXAMPLE_NAME_PREFIX,
  isProjectExample,
  isSpecExample,
  translatorFor,
} from '../src/examples';
import translations from '@chobantonov/jsonforms-extended-spec/examples/container-validation-indicator/translations.json';

const example = examples.find(
  (e) => e.name === 'spec-container-validation-indicator'
);

describe('spec examples', () => {
  test('registers every example from the spec package catalog', () => {
    expect(
      examples
        .filter((e) => isSpecExample(e.name))
        .map((e) => e.name)
        .sort()
    ).toEqual(catalog.map((e) => `${SPEC_EXAMPLE_NAME_PREFIX}${e.id}`).sort());
  });
  test('are registered into the demo list', () => {
    expect(example).toBeDefined();
    expect(example?.label).toBe(
      `${SPEC_EXAMPLE_LABEL_PREFIX}Container validation indicator`
    );
    expect(example?.name.startsWith(SPEC_EXAMPLE_NAME_PREFIX)).toBe(true);
  });

  test('count as this project’s examples, not official ones', () => {
    expect(isProjectExample(example!.name)).toBe(true);
    expect(isSpecExample(example!.name)).toBe(true);
    expect(example!.name.startsWith('jsonforms-')).toBe(false);
  });

  test('carry schema, uischema, data and config', () => {
    expect(example?.schema).toBeDefined();
    expect(example?.uischema).toBeDefined();
    expect(example?.data).toBeDefined();
    expect((example?.config as any)?.jsonformsExtended).toEqual({
      showValidationIndicator: true,
    });
    // the flat tier sits beside it, per Adjustment 1
    expect((example?.config as any)?.restrict).toBe(true);
  });

  test('bind a translator to English, with the catalog reachable', () => {
    expect(example?.i18n?.locale).toBe('en');
    expect(
      example?.i18n?.translate?.('validation.containerErrors', 'fallback')
    ).toContain('error');
  });

  test('translator returns the supplied fallback on a miss', () => {
    const t = translatorFor({ en: { known: 'Known' } }, 'en');
    expect(t('known', 'fb')).toBe('Known');
    expect(t('missing', 'fb')).toBe('fb');
    expect(t('missing')).toBeUndefined();
  });

  test('ships both catalogs section 24 asks for, and can bind either', () => {
    expect(Object.keys(translations).sort()).toEqual(['bg', 'en']);
    // Same keys in both, so neither locale silently falls back to English.
    expect(Object.keys(translations.bg).sort()).toEqual(
      Object.keys(translations.en).sort()
    );
    const bg = translatorFor(translations, 'bg');
    expect(bg('error.required', 'fb')).toBe('Полето е задължително.');
    // An unknown locale yields an empty catalog, so every lookup falls back.
    expect(translatorFor(translations, 'de')('error.required', 'fb')).toBe(
      'fb'
    );
  });
});

describe('numeric controls example', () => {
  const example = examples.find((e) => e.name === 'spec-numeric-controls');

  test('is registered with the Spec prefix', () => {
    expect(example?.label).toBe('Spec: Numeric controls: numbers and integers');
    expect(isSpecExample(example!.name)).toBe(true);
  });

  test('keeps zero and negative values, which are real data', () => {
    const data = example!.data as Record<string, number>;
    // A renderer that treats these as "empty" is the bug this example exists
    // to catch: the slider must show 0, not jump to its default of 10.
    expect(data.quantity).toBe(0);
    expect(data.weightKg).toBe(0);
    expect(data.discountPercent).toBe(0);
    expect(data.toleranceMm).toBe(-2.5);
  });

  test('covers integer entry, number entry and a slider', () => {
    const controls = exampleElements(example!.uischema as any).filter(
      (e: any) => e.type === 'Control'
    );
    expect(controls.map((c: any) => c.scope)).toEqual([
      '#/properties/quantity',
      '#/properties/batchCount',
      '#/properties/unitPrice',
      '#/properties/weightKg',
      '#/properties/toleranceMm',
      '#/properties/discountPercent',
    ]);
    expect(controls.find((c: any) => c.options?.slider === true).scope).toBe(
      '#/properties/discountPercent'
    );
    expect(
      controls.filter((c: any) => c.options?.step !== undefined)
    ).toHaveLength(2);
  });

  test('puts its config keys in the right tier', () => {
    // restrict and showUnfocusedDescription are inherited conventions, so they
    // stay top level rather than under jsonformsExtended.
    const config = example!.config as Record<string, unknown>;
    expect(config.restrict).toBe(true);
    expect(config.showUnfocusedDescription).toBe(true);
    expect(config.jsonformsExtended).toBeUndefined();
  });

  test('ships matching English and Bulgarian keyword messages', () => {
    const catalogs = (example as any).translations;
    expect(Object.keys(catalogs.bg).sort()).toEqual(
      Object.keys(catalogs.en).sort()
    );
    expect(catalogs.en['error.multipleOf']).toContain('{multipleOf}');
  });
});

describe('boolean controls example', () => {
  const example = examples.find((e) => e.name === 'spec-boolean-controls');
  const data = () => example!.data as Record<string, unknown>;

  test('is registered with the Spec prefix', () => {
    expect(example?.label).toBe('Spec: Boolean controls');
    expect(isSpecExample(example!.name)).toBe(true);
  });

  test('covers every renderer that handles a boolean', () => {
    const elements = exampleElements(example!.uischema as any);
    const controls = elements.filter((e: any) => e.type === 'Control');
    const scopes = controls.map((c: any) => c.scope);
    // checkbox, switch, checkbox group, and a table carrying both cells
    expect(scopes).toContain('#/properties/notifications');
    expect(controls.find((c: any) => c.options?.toggle === true).scope).toBe(
      '#/properties/remoteWorker'
    );
    expect(scopes).toContain('#/properties/channels');
    const table = controls.find((c: any) => c.options?.table === true);
    expect(table.scope).toBe('#/properties/team');
    expect(table.options.cells.onCall.toggle).toBe(true);
  });

  test('distinguishes false, absent and null', () => {
    expect(data().notifications).toBe(false);
    expect('newsletter' in data()).toBe(false);
    expect(data().payrollOptOut).toBeNull();
  });

  test('carries the non-boolean values the truthiness bug mishandled', () => {
    // '!!data' rendered the string 'false' as checked, and 0 as a
    // deliberate no.
    expect(data().legacyFlag).toBe('false');
    expect(data().importedCount).toBe(0);
    expect((data().team as any[])[1].active).toBe('false');
  });

  test('ships matching catalogs including the boolean state strings', () => {
    const catalogs = (example as any).translations;
    expect(Object.keys(catalogs.bg).sort()).toEqual(
      Object.keys(catalogs.en).sort()
    );
    expect(catalogs.bg['boolean.notSet']).toBe('Не е зададено');
  });
});

describe('choice and password examples', () => {
  const choice = examples.find((e) => e.name === 'spec-choice-controls');
  const password = examples.find((e) => e.name === 'spec-password-control');
  const controls = (example: any) =>
    exampleElements(example.uischema as any).filter(
      (e: any) => e.type === 'Control'
    );

  test('choice example shows radio groups in both orientations', () => {
    const radios = controls(choice).filter(
      (c: any) => c.options?.format === 'radio'
    );
    expect(radios.filter((c: any) => c.options.vertical === true)).toHaveLength(
      2
    );
    expect(
      radios.filter((c: any) => c.options.vertical === undefined)
    ).not.toHaveLength(0);
  });

  test('choice example keeps an out-of-domain value for correction', () => {
    expect((choice!.data as any).supplier).toBe('Legacy');
    const enumValues = (choice!.schema as any).properties.supplier.enum;
    expect(enumValues).not.toContain('Legacy');
  });

  test('choice example leaves one control unselected', () => {
    // Mounting must not choose the first option.
    expect('region' in (choice!.data as any)).toBe(false);
  });

  test('password example covers both selection paths', () => {
    const bySchemaFormat = (password!.schema as any).properties.password.format;
    expect(bySchemaFormat).toBe('password');
    const byUiOption = controls(password).find(
      (c: any) => c.scope === '#/properties/recoveryPhrase'
    );
    expect(byUiOption.options.format).toBe('password');
    // ...and the plain string beside them has neither.
    expect((password!.schema as any).properties.hint.format).toBeUndefined();
  });

  test('password example demonstrates the otp variant and its precondition', () => {
    const otp = controls(password).filter(
      (c: any) => c.options?.variant === 'otp'
    );
    expect(otp.map((c: any) => c.scope)).toEqual([
      '#/properties/verificationCode',
      '#/properties/backupCode',
    ]);
    const properties = (password!.schema as any).properties;
    // The one that gets the segmented editor: both bounds present.
    expect(properties.verificationCode.minLength).toBe(6);
    expect(properties.verificationCode.maxLength).toBe(6);
    // A PIN is the variant plus a schema constraint, not a second variant.
    expect(properties.verificationCode.pattern).toBe('^[0-9]*$');
    // ...and the one that asks for it but falls back, having no bounds.
    expect(properties.backupCode.minLength).toBeUndefined();
    expect(properties.backupCode.maxLength).toBeUndefined();
  });

  test('password example stores a partial code, for validation to report', () => {
    const data = password!.data as Record<string, string>;
    expect(data.verificationCode).toBe('4829');
    expect(data.verificationCode.length).toBeLessThan(6);
  });

  test('password example masks a column in a table too', () => {
    const table = controls(password).find(
      (c: any) => c.options?.table === true
    );
    expect(table.scope).toBe('#/properties/serviceAccounts');
    const items = (password!.schema as any).properties.serviceAccounts.items;
    expect(items.properties.token.format).toBe('password');
  });

  test('sample people have English names', () => {
    const names = JSON.stringify(
      examples.filter((e) => e.name.startsWith('spec-')).map((e) => e.data)
    );
    for (const cyrillic of ['Петров', 'Мира', 'Иван']) {
      expect(names).not.toContain(cyrillic);
    }
    expect(names).toContain('John Doe');
  });
});

describe('color controls example', () => {
  const example = examples.find((e) => e.name === 'spec-color-control');
  const controls = () =>
    exampleElements(example!.uischema as any).filter(
      (e: any) => e.type === 'Control'
    );
  const data = () => example!.data as Record<string, string>;
  const saveFormatOf = (scope: string) =>
    controls().find((c: any) => c.scope === scope)?.options?.colorSaveFormat;

  test('is registered with the Spec prefix', () => {
    expect(example?.label).toBe('Spec: Color control');
    expect(isSpecExample(example!.name)).toBe(true);
  });

  test('covers every save format, each with a value already in it', () => {
    expect(saveFormatOf('#/properties/brandPrimary')).toBeUndefined();
    expect(data().brandPrimary).toMatch(/^#[0-9a-f]{6}$/);

    expect(saveFormatOf('#/properties/accentColor')).toBe('rgb');
    expect(data().accentColor).toMatch(/^rgb\(\d+, \d+, \d+\)$/);

    expect(saveFormatOf('#/properties/chartSeries')).toBe('hsb');
    expect(data().chartSeries).toMatch(/^hsb\(\d+, \d+%, \d+%\)$/);

    expect(saveFormatOf('#/properties/legacyBadge')).toBe('hex3');
  });

  test('offers no hsl output, but holds a value stored as hsl', () => {
    // hsl is accepted input only: the picker cannot edit it, so it is never
    // written. Highlight is the fixture for reading it back.
    const saveFormats = controls()
      .map((c: any) => c.options?.colorSaveFormat)
      .filter(Boolean);
    expect(saveFormats).not.toContain('hsl');
    expect(saveFormatOf('#/properties/highlight')).toBeUndefined();
    expect(data().highlight).toMatch(/^hsl\(/);
  });

  test('covers both selection paths', () => {
    const schema = example!.schema as any;
    expect(schema.properties.brandPrimary.format).toBe('color');
    // A plain string selected by the UI schema alone.
    expect(schema.properties.statusDot.format).toBeUndefined();
    expect(
      controls().find((c: any) => c.scope === '#/properties/statusDot').options
        .format
    ).toBe('color');
  });

  test('has a picker-only field, and only that one', () => {
    const pickerOnly = controls().filter(
      (c: any) => c.options?.colorTextEntry === false
    );
    expect(pickerOnly.map((c: any) => c.scope)).toEqual([
      '#/properties/printSpot',
    ]);
  });

  test('carries a transparent value and a value outside the profile', () => {
    // Eight-digit hex: the alpha case `hex3` has to refuse rather than flatten.
    expect(data().watermark).toMatch(/^#[0-9a-f]{8}$/);
    // Not in the initial profile, so nothing may interpret it - and, because
    // the `color` format is not registered, nothing reports it either.
    expect(data().importedTint).toContain('display-p3');
  });

  test('preloads a value its own pattern rejects, for correction', () => {
    const schema = example!.schema as any;
    expect(schema.properties.legacyBadge.pattern).toBe('^#[0-9a-fA-F]{3}$');
    expect(data().legacyBadge).toBe('#ed5050');
    expect(data().legacyBadge).not.toMatch(
      new RegExp(schema.properties.legacyBadge.pattern)
    );
  });

  test('puts its config keys in the right tier', () => {
    const config = example!.config as Record<string, unknown>;
    // An inherited convention stays flat...
    expect(config.showUnfocusedDescription).toBe(true);
    // ...while the project's own options are namespaced (Adjustment 1).
    expect(config.jsonformsExtended).toEqual({
      colorSaveFormat: 'hex',
      colorTextEntry: true,
    });
  });

  test('translates the entry hints and the hex3 guidance in both locales', () => {
    const catalogs = (example as any).translations;
    expect(Object.keys(catalogs.bg).sort()).toEqual(
      Object.keys(catalogs.en).sort()
    );
    expect(catalogs.en['color.placeholder.hsb']).toBe('hsb(h, s%, b%)');
    // No hint for a format that is never written.
    expect(catalogs.en['color.placeholder.hsl']).toBeUndefined();
    expect(catalogs.bg['color.hex3Transparency']).toContain('прозрачност');
    expect(catalogs.bg['editor.chooseColor']).toBe('Изберете цвят');
  });
});

describe('categorization example', () => {
  const example = examples.find((e) => e.name === 'spec-categorization');
  const categorizations = () =>
    exampleElements(example!.uischema as any).filter(
      (e: any) =>
        e.type === 'Categorization' &&
        e.elements.some((c: any) => c.name === 'contact')
    );
  const variantOf = (c: any) => c.options?.variant;

  test('is registered with the Spec prefix', () => {
    expect(example?.label).toBe(
      'Spec: Categorization: tabs, stepper, accordion'
    );
    expect(isSpecExample(example!.name)).toBe(true);
  });

  test('shows all three presentations of the same categories', () => {
    const all = categorizations();
    expect(all.map(variantOf)).toEqual([undefined, 'stepper', 'accordion']);
    // The same four categories in each, so switching presentation is visibly
    // the only difference.
    const names = all.map((c: any) =>
      c.elements.map((category: any) => category.name)
    );
    expect(names[0]).toEqual(['contact', 'planning', 'business', 'notes']);
    expect(names[1]).toEqual(names[0]);
    expect(names[2]).toEqual(names[0]);
  });

  test('opens the accordion on a category named by options.initial', () => {
    const accordion = categorizations().find(
      (c: any) => variantOf(c) === 'accordion'
    );
    expect(accordion.options.initial).toBe('planning');
    // `initial` names a Category `name`, not a label or an index.
    expect(
      accordion.elements.some((c: any) => c.name === accordion.options.initial)
    ).toBe(true);
  });

  test('hides a category by its own rule, in every presentation', () => {
    for (const categorization of categorizations()) {
      const business = categorization.elements.find(
        (c: any) => c.name === 'business'
      );
      expect(business.rule.effect).toBe('SHOW');
      expect(business.rule.condition.scope).toBe('#/properties/isBusiness');
    }
  });

  test('gives every category an i18n prefix', () => {
    // A Category has no scope, so without a prefix the lookup key is the
    // literal English label and the catalog is never consulted.
    for (const categorization of categorizations()) {
      for (const category of categorization.elements) {
        expect(category.i18n).toBe(`category.${category.name}`);
      }
    }
  });

  test('puts both indicators in the jsonformsExtended namespace', () => {
    const config = example!.config as Record<string, unknown>;
    expect(config.showUnfocusedDescription).toBe(true);
    expect(config.jsonformsExtended).toEqual({
      showValidationIndicator: true,
      showDataIndicator: true,
    });
  });

  test('puts an error in two different categories', () => {
    // So the indicator is visible on a step or panel that is not on screen,
    // which is the reason it exists.
    const data = example!.data as Record<string, unknown>;
    expect(data.contactName).toBe('Jo');
    expect(data.itemCount).toBe(12);
  });

  test('ships matching English and Bulgarian catalogs', () => {
    const catalogs = (example as any).translations;
    expect(Object.keys(catalogs.bg).sort()).toEqual(
      Object.keys(catalogs.en).sort()
    );
    expect(catalogs.en['category.planning.label']).toBe('Planning');
    expect(catalogs.bg['group.dataIndicator']).toBe('Секцията съдържа данни');
  });
});
