import { JsonFormsUISchemaRegistryEntry } from '@jsonforms/core';

/**
 * Detail layouts supplied by the **registry** rather than by a control.
 *
 * A `.ts` file, like the tuple example's, and for the same reason: a registry
 * entry carries a **tester function**, and a function is not JSON. That is the
 * practical difference between the registry and `options.detail` - the latter
 * is part of the serialized UI model and travels with the form, while this is
 * host code that applies to every object matching the tester, wherever it
 * appears.
 *
 * Both entries below match. Only one of them is used: `handover`'s control
 * asks for `detail: "GENERATE"`, which wins.
 */
export const uischemas: JsonFormsUISchemaRegistryEntry[] = [
  {
    tester: (schema) => (schema?.title === 'Address' ? 10 : -1),
    uischema: {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/line1' },
            { type: 'Control', scope: '#/properties/postcode' },
          ],
        },
        { type: 'Control', scope: '#/properties/city' },
        // The nested object dispatches its own control from here.
        { type: 'Control', scope: '#/properties/geo' },
      ],
    } as any,
  },
  {
    /*
      This entry matches `handover` and is never used, because that control
      carries `detail: "GENERATE"`. It is here so the example can show the
      precedence: without it, "GENERATE" would be indistinguishable from
      having no registry entry at all.

      The reversed order is what makes the difference visible - a registry hit
      would put Gate code first.
    */
    tester: (schema) => (schema?.title === 'Handover' ? 10 : -1),
    uischema: {
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/gateCode' },
        { type: 'Control', scope: '#/properties/window' },
        { type: 'Control', scope: '#/properties/contactName' },
      ],
    } as any,
  },
];
