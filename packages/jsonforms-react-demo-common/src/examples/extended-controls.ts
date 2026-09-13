import { registerExamples } from '@jsonforms/examples';

registerExamples([
  {
    name: 'extended-color',
    label: 'Color',
    schema: {
      type: 'object',
      properties: {
        color: {
          type: 'string',
          format: 'color',
          description: 'Type a hex color or choose a swatch.',
        },
      },
    },
    uischema: { type: 'Control', scope: '#/properties/color' },
    data: { color: '#1976d2' },
  },
  {
    name: 'extended-duration',
    label: 'Duration',
    schema: {
      type: 'object',
      properties: {
        duration: { type: 'string', format: 'duration' },
        weeks: { type: 'string', format: 'duration' },
      },
    },
    uischema: {
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/duration' },
        {
          type: 'Control',
          scope: '#/properties/weeks',
          options: { showActions: false },
        },
      ],
    },
    data: { duration: 'P2DT3H', weeks: 'P2W' },
  },
  {
    name: 'extended-null',
    label: 'Null',
    schema: {
      type: 'object',
      properties: {
        value: {
          type: 'null',
          description: 'Select to store null; clear to leave the value absent.',
        },
      },
    },
    uischema: { type: 'Control', scope: '#/properties/value' },
    data: { value: null },
  },
  {
    name: 'extended-monaco',
    label: 'Monaco Editor',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        document: { type: 'object', additionalProperties: true },
      },
    },
    uischema: {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/code',
          options: {
            format: 'code',
            language: 'javascript',
            monaco: { rows: 8 },
          },
        },
        {
          type: 'Control',
          scope: '#/properties/document',
          options: {
            format: 'code',
            language: 'json',
            convertJson: true,
            monaco: { rows: 8 },
          },
        },
      ],
    },
    data: {
      code: 'const greeting = "Hello";',
      document: { greeting: 'Hello' },
    },
  },
  {
    name: 'extended-ag-grid',
    label: 'AG Grid',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          quantity: { type: 'integer', default: 1 },
          active: { type: 'boolean', default: true },
        },
      },
    },
    uischema: {
      type: 'Control',
      scope: '#',
      options: { variant: 'ag-grid', height: 360 },
    },
    data: [
      { name: 'First item', quantity: 2, active: true },
      { name: 'Second item', quantity: 1, active: false },
    ],
  },
]);
