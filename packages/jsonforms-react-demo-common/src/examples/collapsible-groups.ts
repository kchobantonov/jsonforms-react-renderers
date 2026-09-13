import { registerExamples } from '@jsonforms/examples';

registerExamples([
  {
    name: 'collapsible-groups',
    label: 'Collapsible Groups',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        notes: { type: 'string' },
        active: { type: 'boolean' },
        count: { type: 'integer' },
      },
    },
    data: { name: 'Ada', active: false, count: 0 },
    uischema: {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Group',
          label: 'Contact details',
          options: { collapsible: true, showDataIndicator: true },
          elements: [{ type: 'Control', scope: '#/properties/name' }],
        },
        {
          type: 'Group',
          label: 'Notes (initially collapsed)',
          options: {
            collapsible: true,
            collapsed: true,
            showDataIndicator: true,
          },
          elements: [
            {
              type: 'Control',
              scope: '#/properties/notes',
              options: { multi: true },
            },
          ],
        },
        {
          type: 'Group',
          label: 'False and zero count as data',
          options: {
            collapsible: true,
            collapsed: true,
            showDataIndicator: true,
          },
          elements: [
            { type: 'Control', scope: '#/properties/active' },
            { type: 'Control', scope: '#/properties/count' },
          ],
        },
      ],
    },
  },
]);
