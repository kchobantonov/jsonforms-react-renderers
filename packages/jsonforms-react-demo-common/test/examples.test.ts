import { describe, expect, test } from 'vitest';
import examples, {
  OFFICIAL_EXAMPLE_LABEL_PREFIX,
  OFFICIAL_EXAMPLE_NAME_PREFIX,
  isPrefixedOfficialExample,
  isProjectExample,
  listExamples,
  registerOfficialExamplesWithPrefix,
} from '../src/examples';
import uischema from '../src/examples/presentation-renderers/uischema.json';
import splitUiSchema from '../src/examples/split-layout/uischema.json';

describe('shared demo examples', () => {
  test.each([
    'extended-color',
    'extended-duration',
    'extended-null',
    'extended-monaco',
    'extended-ag-grid',
  ])('registers %s once', (name) => {
    expect(examples.filter((example) => example.name === name)).toHaveLength(1);
  });
  test('registers the Svelte horizontal and vertical Split Layout example', () => {
    const example = examples.find(({ name }) => name === 'split-layout');
    expect(example?.label).toBe('Split Layout');
    expect(example?.uischema).toEqual(splitUiSchema);
  });
  test('makes the Svelte Presentation Renderers example discoverable in the menu', () => {
    const matches = examples.filter((example) =>
      example.label.toLowerCase().includes('presentation')
    );
    const example = matches.find(
      ({ name }) => name === 'presentation-renderers'
    );
    expect(example?.label).toBe('Presentation Renderers');
    expect(example?.uischema).toEqual(uischema);
    expect(uischema.elements.map(({ type }) => type)).toEqual(
      expect.arrayContaining(['ImageView', 'Spacer', 'Separator'])
    );
    // `src` is a top-level field, per section 13. The inline payload is why
    // this example carries a config granting `allowImageDataUrls`.
    expect(
      uischema.elements.find(({ type }) => type === 'ImageView')?.src
    ).toMatch(/^data:image\/svg\+xml;base64,/);
  });
});

describe('official example prefixing', () => {
  const official = examples.filter(({ name }) =>
    isPrefixedOfficialExample(name)
  );

  test('prefixes every official example, and only official ones', () => {
    expect(official.length).toBeGreaterThan(20);
    official.forEach((example) => {
      expect(example.label.startsWith(OFFICIAL_EXAMPLE_LABEL_PREFIX)).toBe(
        true
      );
      expect(isProjectExample(example.name)).toBe(false);
    });
  });

  test('leaves this project’s examples unprefixed', () => {
    const ours = examples.filter(({ name }) => isProjectExample(name));
    expect(ours.length).toBeGreaterThan(0);
    ours.forEach((example) => {
      expect(example.name.startsWith(OFFICIAL_EXAMPLE_NAME_PREFIX)).toBe(false);
      expect(example.label.startsWith(OFFICIAL_EXAMPLE_LABEL_PREFIX)).toBe(
        false
      );
    });
  });

  test('every listed example is either ours or a prefixed official one', () => {
    examples.forEach((example) => {
      expect(
        isProjectExample(example.name) ||
          isPrefixedOfficialExample(example.name)
      ).toBe(true);
    });
  });

  test('tracks the copies it registered rather than testing the name', () => {
    // A name cannot say who created it. If upstream ever ships an example
    // called `jsonforms-*`, it must still be treated as official and prefixed,
    // so this predicate must not degrade into a startsWith check.
    expect('jsonforms-never-registered').toMatch(
      new RegExp(`^${OFFICIAL_EXAMPLE_NAME_PREFIX}`)
    );
    expect(isPrefixedOfficialExample('jsonforms-never-registered')).toBe(false);
    official.forEach((example) => {
      expect(isPrefixedOfficialExample(example.name)).toBe(true);
    });
  });

  test('lists no duplicate names, so originals are filtered out', () => {
    const names = examples.map(({ name }) => name);
    expect(new Set(names).size).toBe(names.length);
  });

  test('a known official example keeps its content under the prefix', () => {
    const person = examples.find(({ name }) => name === 'jsonforms-person');
    expect(person).toBeDefined();
    expect(person?.label).toBe('JsonForms: Person');
    expect(person?.schema).toBeDefined();
    expect(person?.uischema).toBeDefined();
  });

  test('re-running the prefixing is a no-op', () => {
    const before = listExamples().map(({ name }) => name);
    registerOfficialExamplesWithPrefix();
    expect(listExamples().map(({ name }) => name)).toEqual(before);
  });
});

describe('Link example', () => {
  const example = examples.find(({ name }) => name === 'link');

  test('is registered as one of ours', () => {
    expect(example?.label).toBe('Link');
    expect(isProjectExample('link')).toBe(true);
  });

  test('translates its labels through explicit i18n prefixes', async () => {
    const { translatorFor } = await import('../src/i18nCatalogs');
    const { deriveLabelForUISchemaElement } = await import('@jsonforms/core');
    const catalogs = (example as any).translations;
    expect(Object.keys(catalogs).sort()).toEqual(['bg', 'en']);

    const links = (example!.uischema as any).elements.filter(
      (e: any) => e.type === 'Link'
    );
    const label = (element: any, locale: string) =>
      deriveLabelForUISchemaElement(element, translatorFor(catalogs, locale));

    const handbook = links.find((l: any) => l.i18n === 'handbook');
    expect(label(handbook, 'en')).toBe('Employee handbook');
    expect(label(handbook, 'bg')).toBe('Наръчник на служителя');

    // A Link has no scope, so without an i18n prefix the lookup key is the
    // literal label and the catalog is never consulted.
    const untranslated = links.find((l: any) => l.href === '/untranslated');
    expect(untranslated.i18n).toBeUndefined();
    expect(label(untranslated, 'bg')).toBe('Untranslated link');
  });

  test('ships both catalogs with matching keys', () => {
    const catalogs = (example as any).translations;
    expect(Object.keys(catalogs.bg).sort()).toEqual(
      Object.keys(catalogs.en).sort()
    );
  });

  test('demonstrates each branch of the section 13 contract', () => {
    const links = (example!.uischema as any).elements.filter(
      (e: any) => e.type === 'Link'
    );
    const hrefs = links.map((l: any) => l.href);
    // ordinary, new tab, mail, empty (non-navigating), refused by policy
    expect(hrefs).toEqual([
      '/handbook',
      'https://jsonforms.io/docs/',
      'mailto:hr@example.com',
      '',
      'javascript:alert(1)',
      '/untranslated',
    ]);
    expect(links.find((l: any) => l.target === '_blank')).toBeTruthy();
  });
});
