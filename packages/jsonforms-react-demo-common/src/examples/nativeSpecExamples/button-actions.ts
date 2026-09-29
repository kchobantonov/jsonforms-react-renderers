import { UISchemaElement } from '@jsonforms/core';
import type { ButtonUiSchema } from '@chobantonov/jsonforms-react-extended-renderers';
import config from '@chobantonov/jsonforms-extended-spec/examples/button-actions/config.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/button-actions/data.json';
import schema from '@chobantonov/jsonforms-extended-spec/examples/button-actions/schema.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/button-actions/translations.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/button-actions/uischema.json';

/**
 * The button example is three tabs, and the split is the lesson.
 *
 * **Action** and **Script** come from `uischema.json`: everything a `Button`
 * can express **portably** - actions, params, colours, a string script, and
 * the two mistakes the runtime has to cope with. That file is ordinary JSON
 * and goes over the wire unchanged.
 *
 * **TypeScript** is added here, because it cannot. Section 14 allows a
 * `script` to be a **function** for a model authored in TypeScript - "an
 * in-memory JS/TS UI model can carry them directly while JSON serialization
 * cannot" - and that is the point of showing them: open the UI schema panel
 * and the third tab's buttons appear with no `script` at all, because a
 * function has no JSON spelling.
 *
 * The two halves are separated by a tab rather than by a horizontal rule so
 * the boundary is impossible to read past.
 *
 * They also need no `allowScriptEvaluation`. That permission exists because
 * compiling a string needs CSP `unsafe-eval`; a function the build already
 * compiled needs nothing of the sort.
 *
 * **Everything here is typed.** `satisfies ButtonUiSchema` checks the element
 * and contextually types the script, so `event` below is an `ActionEvent`
 * without being annotated - which is the whole reason to author a model in
 * TypeScript rather than in JSON.
 */

/** Records what a script did, so the example can show it happened. */
const log = (message: string) => {
  // eslint-disable-next-line no-console
  console.log(`[button-actions] ${message}`);
};

/*
  The idiomatic form. `event` is inferred, not declared: `.call()` cannot bind
  an arrow function's `this`, so the event is handed over as an argument and an
  arrow is the natural way to write one.
*/
const arrowScript = {
  type: 'Button',
  label: 'Arrow function',
  color: 'alternative',
  params: { tier: 'express' },
  script: (event) => log(`arrow saw params ${JSON.stringify(event.params)}`),
} satisfies ButtonUiSchema;

/*
  `this` is bound as well, so a body pasted across from the string form keeps
  working. It needs a `this` annotation to be checked, which is the cost of
  the older idiom rather than a fault in it.
*/
const thisScript = {
  type: 'Button',
  label: 'Classic function',
  color: 'alternative',
  params: { tier: 'standard' },
  script: function (this: { params?: Record<string, unknown> }) {
    log(`this saw params ${JSON.stringify(this.params)}`);
  },
} satisfies ButtonUiSchema;

/*
  Awaited exactly as a string script is - the caller cannot tell the two
  apart, so pending and duplicate-activation behave the same way.
*/
const asyncScript = {
  type: 'Button',
  label: 'Async function',
  color: 'alternative',
  script: async () => {
    log('async started');
    await new Promise((resolve) => setTimeout(resolve, 1200));
    log('async finished');
  },
} satisfies ButtonUiSchema;

/*
  What the type refuses. Left here as a comment because it is the point of the
  XOR: an element carrying both an action and a script is an authoring mistake,
  and in TypeScript it is not expressible.

  const bad = {
    type: 'Button',
    label: 'Both',
    action: 'submit',
    script: () => log('never runs'),
  } satisfies ButtonUiSchema;

  //  Type '{ type: "Button"; … }' is not assignable to type
  //  '{ action?: never; script?: never; }'.
  //    Types of property 'action' are incompatible.
  //      Type 'string' is not assignable to type 'never'.
*/

/*
  The third tab. It is a whole `Category`, appended to the `Categorization`
  that `uischema.json` declares - which is the point: the portable half is a
  complete, valid form on its own, and the TypeScript half is an extra tab
  added to it rather than an edit of it.
*/
const typescriptCategory = {
  type: 'Category',
  name: 'typescript',
  i18n: 'typescriptTab',
  label: 'TypeScript',
  elements: [
    { type: 'Label', i18n: 'typescript' },
    arrowScript,
    thisScript,
    asyncScript,
  ],
} as unknown as UISchemaElement;

type Layoutish = { type: string; elements: UISchemaElement[] };

/*
  Structural, not positional. Finding the `Categorization` by type means
  reordering `uischema.json` cannot silently append the tab to the wrong
  parent - which an `elements[4]` would do without a word.
*/
const withTypescriptTab = (root: UISchemaElement): UISchemaElement => {
  const layout = root as unknown as Layoutish;
  const elements = layout.elements ?? [];
  const index = elements.findIndex(
    (element) => (element as { type?: string }).type === 'Categorization'
  );
  if (index === -1) {
    throw new Error(
      'button-actions: uischema.json no longer has a Categorization to add the TypeScript tab to.'
    );
  }
  const categorization = elements[index] as unknown as Layoutish;
  const replaced = elements.slice();
  replaced[index] = {
    ...categorization,
    elements: [...categorization.elements, typescriptCategory],
  } as unknown as UISchemaElement;
  return { ...layout, elements: replaced } as unknown as UISchemaElement;
};

const composed = withTypescriptTab(uischema as unknown as UISchemaElement);

export { config, data, schema, translations, uischema, composed };
