import { JsonFormsUISchemaRegistryEntry } from '@jsonforms/core';

/**
 * Position Controls for the complex positions of `pickupContact`.
 *
 * This is a `.ts` file where every other example ships `.json`, and the reason
 * is not convenience. A registry entry carries a **tester function**, and the
 * UI-schema registry is host code rather than part of the serialized UI model -
 * the specification says to "use the existing ranked UI-schema registry to
 * select a position-specific Control", which is a host mechanism. A UI schema
 * is JSON; a registry is not.
 *
 * Each entry's `options.summary` is the preview shown beside the closed
 * position, and `options.detail` is the form the dialog opens.
 */
export const uischemas: JsonFormsUISchemaRegistryEntry[] = [
  /*
    The four ways a registry entry can describe a complex position. Each of
    `handoffContacts`'s positions has a different title so a tester can pick
    them apart, which is the only reason they differ at all.
  */
  {
    // 1. summary + detail: a preview inline, and its own dialog form.
    tester: (schema) => (schema?.title === 'Both' ? 10 : -1),
    uischema: {
      type: 'Control',
      scope: '#',
      options: {
        summary: { type: 'Control', scope: '#/properties/name' },
        detail: {
          type: 'VerticalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/desk' },
            { type: 'Control', scope: '#/properties/name' },
          ],
        },
      },
    } as any,
  },
  {
    /*
      2. detail only. With no summary descriptor the preview falls back to the
      localized "View details", and the dialog still uses the detail.
    */
    tester: (schema) => (schema?.title === 'DetailOnly' ? 10 : -1),
    uischema: {
      type: 'Control',
      scope: '#',
      options: {
        detail: {
          type: 'VerticalLayout',
          elements: [{ type: 'Control', scope: '#/properties/desk' }],
        },
      },
    } as any,
  },
  {
    /*
      3. an entry that is already a layout. "A registry entry that is already a
      layout remains usable directly as the dialog detail" - so it needs no
      wrapping Control and no `detail` key.
    */
    tester: (schema) => (schema?.title === 'LayoutEntry' ? 10 : -1),
    uischema: {
      type: 'HorizontalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/name' },
        { type: 'Control', scope: '#/properties/desk' },
      ],
    } as any,
  },
  /*
    4. no entry at all - `NoEntry` matches no tester, so the position falls back
    to a generated form. Nothing to declare here; its absence is the case.

    A fifth combination, **an entry that is a Control carrying `summary` but no
    `detail`**, is deliberately missing: opening its dialog currently hangs.
    See the TODO in Adjustment 20.
  */

  {
    tester: (schema) => (schema?.title === 'Address' ? 10 : -1),
    uischema: {
      type: 'Control',
      scope: '#',
      options: {
        summary: { type: 'Control', scope: '#/properties/street' },
        detail: {
          type: 'VerticalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/street' },
            { type: 'Control', scope: '#/properties/city' },
          ],
        },
      },
    } as any,
  },
  {
    tester: (schema) => (schema?.title === 'Phone numbers' ? 10 : -1),
    uischema: {
      type: 'Control',
      scope: '#',
      options: {
        // Scope `#` on an array summary resolves against each item, so each
        // phone string previews itself.
        summary: { type: 'Control', scope: '#' },
        detail: { type: 'Control', scope: '#' },
      },
    } as any,
  },
];
