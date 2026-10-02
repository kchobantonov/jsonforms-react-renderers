import { describe, expect, test } from 'vitest';
import examples, {
  OFFICIAL_EXAMPLE_LABEL_PREFIX,
  OFFICIAL_EXAMPLE_NAME_PREFIX,
  isPrefixedOfficialExample,
  isProjectExample,
  isSpecExample,
  registerProjectExamples,
  listExamples,
  registerOfficialExamplesWithPrefix,
} from '../src/examples';
describe('default demo catalog', () => {
  test('contains only spec and original JSON Forms examples', () => {
    expect(examples.length).toBeGreaterThan(40);
    expect(
      examples.every(
        ({ name }) => isSpecExample(name) || isPrefixedOfficialExample(name)
      )
    ).toBe(true);
  });
  test('keeps native enhancements within their spec examples', () => {
    const templates = examples.find(
      ({ name }) => name === 'spec-template-layout'
    )!;
    const walk = (value: any): boolean =>
      typeof value === 'function' ||
      Boolean(
        value && typeof value === 'object' && Object.values(value).some(walk)
      );
    expect(walk(templates.uischema)).toBe(true);
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
  const example = examples.find(({ name }) => name === 'spec-presentation');

  test('is registered as one of ours', () => {
    expect(example?.label).toBe('Spec: Presentation elements');
    expect(isSpecExample('spec-presentation')).toBe(true);
  });

  test('translates its labels through explicit i18n prefixes', async () => {
    const { translatorFor } = await import('../src/i18nCatalogs');
    const { deriveLabelForUISchemaElement } = await import('@jsonforms/core');
    const catalogs = (example as any).translations;
    expect(Object.keys(catalogs).sort()).toEqual(['bg', 'en']);

    const links = (example!.uischema as any).elements
      .find((e: any) => e.type === 'Categorization')
      .elements.find((e: any) => e.name === 'link')
      .elements.filter((e: any) => e.type === 'Link');
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
    const links = (example!.uischema as any).elements
      .find((e: any) => e.type === 'Categorization')
      .elements.find((e: any) => e.name === 'link')
      .elements.filter((e: any) => e.type === 'Link');
    const hrefs = links.map((l: any) => l.href);
    // ordinary, new tab, mail, empty (non-navigating), refused by policy
    expect(hrefs).toEqual(
      expect.arrayContaining([
        '/handbook',
        'https://jsonforms.io/docs/',
        'mailto:hr@example.com',
        '',
        'javascript:alert(1)',
        '/untranslated',
      ])
    );
    expect(links.find((l: any) => l.target === '_blank')).toBeTruthy();
  });
});

test('allows host examples to be registered after the default catalog loads', () => {
  registerProjectExamples([
    {
      name: 'host-extra',
      label: 'Host extra',
      schema: { type: 'string' },
      uischema: { type: 'Control', scope: '#' },
      data: 'hello',
    },
  ]);
  expect(listExamples().find(({ name }) => name === 'host-extra')?.data).toBe(
    'hello'
  );
  expect(isPrefixedOfficialExample('host-extra')).toBe(false);
});
