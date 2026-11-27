import { expect, it } from 'vite-plus/test';
import {
  createTranslator,
  parseBoolean,
  parseJson,
  parseMode,
} from '../../src/webcomponent/input';
import { FormElement, formAttributes } from '../../src/webcomponent/element';
it.each([
  [true, true],
  [false, false],
  ['', true],
  ['TRUE', true],
  ['false', false],
  ['False', false],
  ['yes', undefined],
  [null, undefined],
  [1, undefined],
])('parses boolean input %j', (input, expected) =>
  expect(parseBoolean(input)).toBe(expected),
);
it.each([
  ['dark', 'dark'],
  ['light', 'light'],
  ['system', 'system'],
  ['Dark', 'system'],
  [null, 'system'],
])('resolves color mode %j', (input, expected) =>
  expect(parseMode(input)).toBe(expected),
);
it('distinguishes typed values, empty attributes and malformed JSON', () => {
  const value = { x: 1 };
  expect(parseJson(value)).toBe(value);
  expect(parseJson('  ')).toBeUndefined();
  expect(parseJson('{"x":1}')).toEqual(value);
  expect(() => parseJson('{')).toThrow();
});
it('resolves localized, flat, label-shaped and missing translations', () => {
  const translate = createTranslator(
    {
      bg: { greeting: 'Здравей' },
      flat: 'Flat',
      wrapped: { label: 'Label' },
      invalid: 1,
    },
    'bg',
  );
  expect(translate('greeting', 'fallback')).toBe('Здравей');
  expect(translate('flat', 'fallback')).toBe('Flat');
  expect(translate('wrapped', 'fallback')).toBe('Label');
  expect(translate('invalid', 'fallback')).toBe('fallback');
  expect(translate('missing', undefined)).toBe('missing');
  expect(createTranslator('{"hello":"Hello"}')('hello', '')).toBe('Hello');
  const custom = () => 'custom';
  expect(createTranslator(custom)).toBe(custom);
  expect(createTranslator(undefined)('missing', 'fallback')).toBe('fallback');
});
class TestFormElement extends FormElement {
  protected state: any = {};
  writes: Record<string, unknown> = {};
  protected setValue(name: string, value: unknown) {
    this.state[name] = value;
    this.writes[name] = value;
  }
  read() {
    return this.readFormInput();
  }
}
customElements.define('common-test-form', TestFormElement);
it('maps host properties and attributes into form input without losing JSON values', () => {
  const element = document.createElement('common-test-form') as TestFormElement;
  expect(element.read()).toBeUndefined();
  element.data = 'null';
  expect(element.read()).toBeUndefined();
  element.schema = '{"type":"number"}';
  element.data = '0';
  expect(element.read()).toEqual({ schema: { type: 'number' }, data: 0 });
  element.uischema = {};
  element.uischemas = [];
  element.external = { count: 0 };
  element.config = {};
  element.readonly = false;
  element.validationMode = 'NoValidation';
  element.locale = 'bg';
  element.translations = {};
  element.additionalErrors = [];
  element.dark = true;
  element.mode = 'dark';
  element.rtl = true;
  element.customStyle = 'color:red';
  element.rendererSettings = {};
  element.attributeChangedCallback('locale', 'en', 'de');
  expect(element.external).toEqual({ count: 0 });
  expect(element.writes).toMatchObject({
    locale: 'de',
    validationMode: 'NoValidation',
    dark: true,
    mode: 'dark',
    readonly: false,
    rtl: true,
    customStyle: 'color:red',
  });
  expect(formAttributes).toContain('external');
});

it('resolves own nested catalog entries, preferring literal dotted keys', () => {
  const translate = createTranslator(
    {
      bg: {
        temporal: {
          datePlaceholder: 'Nested date',
          timePlaceholder: 'Nested time',
        },
        'temporal.datePlaceholder': 'Literal date',
        empty: '',
        invalid: { value: 1 },
      },
    },
    'bg',
  );
  expect(translate('temporal.datePlaceholder', 'fallback')).toBe(
    'Literal date',
  );
  expect(translate('temporal.timePlaceholder', 'fallback')).toBe('Nested time');
  expect(translate('empty', 'fallback')).toBe('');
  expect(translate('invalid.value', 'fallback')).toBe('fallback');
  const inherited = Object.create({ hidden: 'Inherited' });
  inherited.visible = 'Own';
  expect(createTranslator(inherited)('hidden', 'fallback')).toBe('fallback');
  expect(createTranslator(inherited)('visible', 'fallback')).toBe('Own');
  expect(translate('constructor.name', 'fallback')).toBe('fallback');
});

it('falls back from a regional wrapper locale to its language catalog', () => {
  const translate = createTranslator(
    { bg: { nested: { label: 'Български' } }, fallback: 'Root' },
    'bg-BG',
  );
  expect(translate('nested.label', 'English')).toBe('Български');
  expect(translate('fallback', 'English')).toBe('Root');
});
