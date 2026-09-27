import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import type { TemplateRender } from '@chobantonov/jsonforms-react-extended-renderers';
import React from 'react';
import { registerSpecExamples } from '../registry';
import config from './config.json';
import data from './data.json';
import schema from './schema.json';
import translations from './translations.json';
import uischema from './uischema.json';

/**
 * Three engines, one feature, one tab each.
 *
 * `uischema.json` carries the two **portable** profiles - `lang: "jsx"` and
 * `lang: "ractive"` - plus the tab that shows how a language is resolved. Both
 * are strings, so both survive serialization and can be sent to another
 * renderer set on another platform.
 *
 * The third tab cannot be. Its `template` is a **function**, which is the
 * React-native form of the same element: no parser, no `new Function`, and
 * therefore no `allowScriptEvaluation` - the permission exists for CSP
 * `unsafe-eval`, which a function the build already compiled does not need.
 * Adjustment 29.7 sets out what a native profile has to define; this is that
 * profile's worked example.
 *
 * Open the UI schema panel with the third tab selected: the `TemplateLayout`
 * is there and its `template` is not, because `JSON.stringify` drops a
 * function silently.
 */

interface RegistrationData {
  customerName?: string;
  priority?: boolean;
  contacts?: { name?: string }[];
  nativeNote?: string;
}

/*
  A component defined here and used directly. It is registered nowhere and
  dispatched through nothing - the clearest thing a native template can do
  that a string one cannot, since a string template can only reach what the
  engine chose to put in its scope.
*/
const Pill = ({ children }: { children: React.ReactNode }) => (
  <span
    data-pill
    style={{
      display: 'inline-block',
      padding: '0 0.5rem',
      borderRadius: '999px',
      border: '1px solid currentColor',
      fontSize: '0.8em',
    }}
  >
    {children}
  </span>
);

/*
  The same five things the two string templates say, written as TypeScript.

  Every binding below is typed: `data` through the type argument, and `Slot`,
  `errors` and `readonly` from `TemplateRenderProps`. Misspell `data.custmerName`
  and it is a compile error rather than an empty span at runtime - which is the
  practical reason to reach for this form.
*/
const nativeTemplate: TemplateRender<RegistrationData> = ({
  data: formData,
  Slot,
  errors,
  readonly,
}) => (
  <div>
    <p data-greeting>Hello {formData?.customerName}</p>
    <p data-branch>
      {formData?.priority ? 'Priority booking' : 'Standard booking'}
    </p>
    <p data-list>
      Contacts: {(formData?.contacts ?? []).map((c) => c.name).join(', ')}
    </p>
    <div data-slot>
      <Slot name='nativeNote' />
    </div>
    {/* Only a function has these: a local component, and live form state. */}
    <p data-native-extra>
      <Pill>{errors.length} problems</Pill>
      {readonly ? ' · read-only' : ' · editable'}
    </p>
    {/* A slot nobody declared falls back to its children, and warns. */}
    <div data-fallback>
      <Slot name='notDeclared'>nothing is named that</Slot>
    </div>
  </div>
);

const nativeCategory = {
  type: 'Category',
  name: 'native',
  label: 'native (TypeScript)',
  elements: [
    {
      type: 'Label',
      text: 'A function, not a string. No parser, no permission, no portability.',
    },
    {
      type: 'TemplateLayout',
      template: nativeTemplate,
      elements: [
        {
          type: 'Control',
          scope: '#/properties/nativeNote',
          name: 'nativeNote',
        },
      ],
    },
  ],
} as unknown as UISchemaElement;

type Layoutish = { type: string; elements: UISchemaElement[] };

/*
  Inserted before the language-resolution tab, and located **structurally**.
  An `elements[3]` would keep compiling and quietly attach the tab to the wrong
  parent the first time `uischema.json` is reordered.
*/
const withNativeTab = (root: UISchemaElement): UISchemaElement => {
  const layout = root as unknown as Layoutish;
  const elements = layout.elements ?? [];
  const index = elements.findIndex(
    (element) => (element as { type?: string }).type === 'Categorization'
  );
  if (index === -1) {
    throw new Error(
      'template-layout: uischema.json no longer has a Categorization to add the native tab to.'
    );
  }
  const categorization = elements[index] as unknown as Layoutish;
  const categories = categorization.elements.slice();
  const resolution = categories.findIndex(
    (category) => (category as { name?: string }).name === 'resolution'
  );
  categories.splice(
    resolution === -1 ? categories.length : resolution,
    0,
    nativeCategory
  );
  const replaced = elements.slice();
  replaced[index] = {
    ...categorization,
    elements: categories,
  } as unknown as UISchemaElement;
  return { ...layout, elements: replaced } as unknown as UISchemaElement;
};

const composed = withNativeTab(uischema as unknown as UISchemaElement);

registerSpecExamples([
  {
    id: 'template-layout',
    label: 'Template layout: three engines',
    schema: schema as JsonSchema,
    uischema: composed,
    data,
    config,
    translations,
  },
]);

export { config, data, schema, translations, uischema, composed };
