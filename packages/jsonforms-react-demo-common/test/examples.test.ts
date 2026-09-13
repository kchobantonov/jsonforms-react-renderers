import { describe, expect, test } from 'vitest';
import examples from '../src/examples';
import uischema from '../src/examples/presentation-renderers/uischema.json';

describe('shared demo examples', () => {
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
    expect(
      uischema.elements.find(({ type }) => type === 'ImageView')?.options?.src
    ).toMatch(/^data:image\/svg\+xml;base64,/);
  });
});
