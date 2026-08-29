import {
  JsonSchema,
  NOT_APPLICABLE,
  RankedTester,
  UISchemaElement,
} from '@jsonforms/core';

type Contract = {
  schema: JsonSchema;
  uischema: UISchemaElement;
  rank: number;
};

const control = (options?: Record<string, unknown>): UISchemaElement => ({
  type: 'Control',
  scope: '#/properties/value',
  ...(options ? { options } : {}),
});

const objectArray = {
  type: 'array',
  items: {
    type: 'object',
    properties: { name: { type: 'string' } },
  },
};

const contracts: Record<string, Contract> = {
  AnyOfRenderer: {
    schema: {
      type: 'object',
      properties: {
        value: { anyOf: [{ type: 'string' }, { type: 'number' }] },
      },
    },
    uischema: control(),
    rank: 3,
  },
  AnyOfStringOrEnumControl: {
    schema: {
      type: 'object',
      properties: {
        value: {
          anyOf: [{ type: 'string' }, { type: 'string', enum: ['A', 'B'] }],
        },
      },
    },
    uischema: control(),
    rank: 5,
  },
  ArrayControl: {
    schema: { type: 'object', properties: { value: objectArray } },
    uischema: control(),
    rank: 3,
  },
  ArrayLayout: {
    schema: {
      type: 'object',
      properties: {
        value: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              nested: {
                type: 'object',
                properties: { name: { type: 'string' } },
              },
            },
          },
        },
      },
    },
    uischema: control(),
    rank: 4,
  },
  BooleanCell: {
    schema: { type: 'object', properties: { value: { type: 'boolean' } } },
    uischema: control(),
    rank: 2,
  },
  CategorizationLayout: {
    schema: { type: 'object' },
    uischema: {
      type: 'Categorization',
      elements: [{ type: 'Category', label: 'General', elements: [] }],
    },
    rank: 1,
  },
  CategorizationStepperLayout: {
    schema: { type: 'object' },
    uischema: {
      type: 'Categorization',
      options: { variant: 'stepper' },
      elements: [{ type: 'Category', label: 'General', elements: [] }],
    },
    rank: 2,
  },
  DateCell: {
    schema: {
      type: 'object',
      properties: { value: { type: 'string', format: 'date' } },
    },
    uischema: control(),
    rank: 2,
  },
  DateControl: {
    schema: {
      type: 'object',
      properties: { value: { type: 'string', format: 'date' } },
    },
    uischema: control(),
    rank: 4,
  },
  DateTimeControl: {
    schema: {
      type: 'object',
      properties: { value: { type: 'string', format: 'date-time' } },
    },
    uischema: control(),
    rank: 2,
  },
  EnumArrayRenderer: {
    schema: {
      type: 'object',
      properties: {
        value: {
          type: 'array',
          uniqueItems: true,
          items: { type: 'string', enum: ['A', 'B'] },
        },
      },
    },
    uischema: control(),
    rank: 5,
  },
  EnumCell: {
    schema: {
      type: 'object',
      properties: { value: { type: 'string', enum: ['A', 'B'] } },
    },
    uischema: control(),
    rank: 2,
  },
  EnumControl: {
    schema: {
      type: 'object',
      properties: { value: { type: 'string', enum: ['A', 'B'] } },
    },
    uischema: control(),
    rank: 2,
  },
  GroupLayout: {
    schema: { type: 'object' },
    uischema: { type: 'Group', elements: [] },
    rank: 2,
  },
  HorizontalLayout: {
    schema: { type: 'object' },
    uischema: { type: 'HorizontalLayout', elements: [] },
    rank: 2,
  },
  IntegerCell: {
    schema: { type: 'object', properties: { value: { type: 'integer' } } },
    uischema: control(),
    rank: 2,
  },
  LabelRenderer: {
    schema: { type: 'object' },
    uischema: { type: 'Label', text: 'A label' },
    rank: 1,
  },
  ListWithDetailRenderer: {
    schema: { type: 'object', properties: { value: objectArray } },
    uischema: { type: 'ListWithDetail', scope: '#/properties/value' },
    rank: 4,
  },
  NativeControl: {
    schema: {
      type: 'object',
      properties: { value: { type: 'string', format: 'date' } },
    },
    uischema: control(),
    rank: 2,
  },
  NumberCell: {
    schema: { type: 'object', properties: { value: { type: 'number' } } },
    uischema: control(),
    rank: 2,
  },
  ObjectControl: {
    schema: {
      type: 'object',
      properties: {
        value: { type: 'object', properties: { name: { type: 'string' } } },
      },
    },
    uischema: control(),
    rank: 2,
  },
  OneOfEnumCell: {
    schema: {
      type: 'object',
      properties: {
        value: {
          type: 'string',
          oneOf: [
            { const: 'A', title: 'Option A' },
            { const: 'B', title: 'Option B' },
          ],
        },
      },
    },
    uischema: control(),
    rank: 2,
  },
  OneOfRenderer: {
    schema: {
      type: 'object',
      properties: {
        value: { oneOf: [{ type: 'string' }, { type: 'number' }] },
      },
    },
    uischema: control(),
    rank: 3,
  },
  RadioGroupControl: {
    schema: {
      type: 'object',
      properties: { value: { type: 'string', enum: ['A', 'B'] } },
    },
    uischema: control({ format: 'radio' }),
    rank: 20,
  },
  OneOfRadioGroupControl: {
    schema: {
      type: 'object',
      properties: {
        value: { type: 'string', oneOf: [{ const: 'A', title: 'Option A' }] },
      },
    },
    uischema: control({ format: 'radio' }),
    rank: 20,
  },
  TextCell: {
    schema: { type: 'object', properties: { value: { type: 'string' } } },
    uischema: control(),
    rank: 1,
  },
  TextControl: {
    schema: { type: 'object', properties: { value: { type: 'string' } } },
    uischema: control(),
    rank: 1,
  },
  TimeCell: {
    schema: {
      type: 'object',
      properties: { value: { type: 'string', format: 'time' } },
    },
    uischema: control(),
    rank: 2,
  },
  TimeControl: {
    schema: {
      type: 'object',
      properties: { value: { type: 'string', format: 'time' } },
    },
    uischema: control(),
    rank: 4,
  },
  VerticalLayout: {
    schema: { type: 'object' },
    uischema: { type: 'VerticalLayout', elements: [] },
    rank: 1,
  },
};

export const runRendererContract = (
  name: keyof typeof contracts,
  tester: RankedTester
) => {
  const contract = contracts[name];

  describe(`${name} tester contract`, () => {
    it('selects its matching JSON Forms schema and UI schema', () => {
      expect(tester(contract.uischema, contract.schema, undefined)).toBe(
        contract.rank
      );
    });

    it('does not select an unrelated UI schema', () => {
      expect(tester({ type: 'Unknown' }, { type: 'null' }, undefined)).toBe(
        NOT_APPLICABLE
      );
    });
  });
};

export const runRendererExportContract = (name: string, renderer: unknown) => {
  describe(`${name} renderer contract`, () => {
    it('exports a React renderer', () => {
      expect(typeof renderer).toBe('function');
    });
  });
};
