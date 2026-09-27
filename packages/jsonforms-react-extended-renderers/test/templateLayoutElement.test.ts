import { describe, expect, it } from 'vitest';
import { TEMPLATE_LANGS, resolveTemplateLang } from '../src/util/templateLang';
import type { TemplateLayoutElement } from '../src/util/templateLang';
import {
  isNamedUISchemaElement,
  type ExtendedUISchemaElement,
  type NamedUISchemaElement,
} from '../src/core/uiSchema';

/*
  The element's own type.

  `lang` is deliberately **not** narrowed to the two engines this set
  implements. The specification requires an unknown language to be diagnosed
  rather than refused, and names `vue` as a profile a web renderer set need not
  implement - so a closed union would make the diagnostic path unauthorable:
  the very case the renderer exists to report could not be written down.

  The assertions below are as much about what compiles as about what they
  return; this package typechecks its tests, so a narrowing of `lang` fails
  the build here rather than silently in a consumer.
*/

describe('the element type', () => {
  it('accepts the languages this set implements', () => {
    const jsx: TemplateLayoutElement = {
      type: 'TemplateLayout',
      template: '<p>{data.name}</p>',
      lang: 'jsx',
      elements: [],
    };
    const ractive: TemplateLayoutElement = {
      type: 'TemplateLayout',
      template: '<p>{{data.name}}</p>',
      lang: 'ractive',
      elements: [],
    };
    expect(resolveTemplateLang(jsx, undefined).lang).toBe('jsx');
    expect(resolveTemplateLang(ractive, undefined).lang).toBe('ractive');
  });

  /*
    The case the open type exists for. If `lang` were narrowed this would not
    compile, and the "diagnose, do not guess" contract could not be exercised.
  */
  it('accepts a language it will go on to diagnose', () => {
    const unknown: TemplateLayoutElement = {
      type: 'TemplateLayout',
      template: '<p>never rendered</p>',
      lang: 'handlebars',
      elements: [],
    };
    const resolved = resolveTemplateLang(unknown, undefined);
    expect(resolved.diagnostic).toBe('unsupported');
    expect(resolved.requested).toBe('handlebars');
    expect(resolved.lang).toBeUndefined();
  });

  /* The specification names this one, and this set does not implement it. */
  it('accepts the vue profile, and diagnoses it', () => {
    const vue: TemplateLayoutElement = {
      type: 'TemplateLayout',
      template: '<p><slot name="body" /></p>',
      lang: 'vue',
      elements: [],
    };
    expect(resolveTemplateLang(vue, undefined).diagnostic).toBe('unsupported');
  });

  it('leaves lang optional, and resolves the default', () => {
    const noLang: TemplateLayoutElement = {
      type: 'TemplateLayout',
      template: '<p>{{data.name}}</p>',
      elements: [],
    };
    expect(resolveTemplateLang(noLang, undefined).lang).toBe('ractive');
  });

  /* `elements` comes from `Layout`, which is why the type extends it. */
  it('carries children, and a name for registry lookup', () => {
    const element: TemplateLayoutElement = {
      type: 'TemplateLayout',
      template: '<div>{{>body}}</div>',
      name: 'contactSection',
      elements: [
        { type: 'Control', scope: '#/properties/email', name: 'body' },
      ],
    };
    expect(element.elements).toHaveLength(1);
    expect(element.name).toBe('contactSection');
  });

  it('keeps the implemented set in one place', () => {
    expect([...TEMPLATE_LANGS]).toEqual(['ractive', 'jsx']);
  });
});

/*
  `name` on any element, which section 2 declares and core does not:

      export type NamedUISchemaElement = UISchemaElement & { name: string };

  with "`name` is used where an element must be referenced". It is read by the
  `Template` registry lookup, `Slot` resolution, a Ractive partial, a
  `Button`'s action name and `Categorization.options.initial` - so it belongs
  to the element model, not to any one renderer.
*/
describe('naming an element', () => {
  /* The spec's own declaration: a name, required. */
  it('requires a name where the type promises one', () => {
    const named: NamedUISchemaElement = {
      type: 'Control',
      name: 'body',
    } as NamedUISchemaElement;
    expect(named.name).toBe('body');
  });

  /* And the everyday case: any element may carry one. */
  it('leaves it optional on an ordinary element', () => {
    const anonymous: ExtendedUISchemaElement = { type: 'Label' };
    const labelled: ExtendedUISchemaElement = { type: 'Label', name: 'intro' };
    expect(anonymous.name).toBeUndefined();
    expect(labelled.name).toBe('intro');
  });

  it('recognises a usable name', () => {
    expect(isNamedUISchemaElement({ type: 'Control', name: 'a' } as any)).toBe(
      true
    );
    expect(isNamedUISchemaElement({ type: 'Control' })).toBe(false);
    expect(isNamedUISchemaElement(undefined)).toBe(false);
  });

  /* An empty name cannot address anything, so it does not count as one. */
  it('does not count an empty name', () => {
    expect(isNamedUISchemaElement({ type: 'Control', name: '' } as any)).toBe(
      false
    );
  });
});
