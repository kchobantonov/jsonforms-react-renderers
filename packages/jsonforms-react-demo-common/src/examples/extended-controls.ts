import { registerProjectExamples } from './registry';

registerProjectExamples([
  {
    name: 'extended-color',
    label: 'Color',
    schema: {
      type: 'object',
      properties: {
        // AJV has no built-in "color" format - ajv-formats does not define one -
        // so `format` only selects the renderer. The pattern does the validating.
        shortColor: {
          type: 'string',
          format: 'color',
          pattern: '^#[0-9a-fA-F]{3}$',
          title: 'Short color',
          description:
            'Three-digit output only. Picker colors are rounded to the nearest #RGB color.',
        },
        brandColor: {
          type: 'string',
          format: 'color',
          pattern: '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$',
          title: 'Brand color',
        },
        overlayColor: {
          type: 'string',
          format: 'color',
          pattern: '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$',
          title: 'Overlay color',
        },
      },
    },
    uischema: {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/shortColor',
          options: { colorSaveFormat: 'hex3', showUnfocusedDescription: true },
        },
        { type: 'Control', scope: '#/properties/brandColor' },
        { type: 'Control', scope: '#/properties/overlayColor' },
      ],
    },
    data: {
      shortColor: '#fff',
      brandColor: '#00ff00',
      overlayColor: '#ff000080',
    },
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
        javascript: {
          type: 'string',
          description: 'Please type some JavaScript',
        },
        html: { type: 'string', description: 'Please type some HTML' },
        // Drives the language of the "Code" editor below at runtime.
        language: {
          type: 'string',
          oneOf: [
            { const: 'javascript', title: 'JavaScript' },
            { const: 'html', title: 'HTML' },
            { const: 'json', title: 'JSON' },
          ],
        },
        code: { type: 'string', description: 'Please type some code' },
        document: { type: 'object', additionalProperties: true },
      },
      required: ['javascript'],
    },
    uischema: {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          label: 'JavaScript (auto-grow)',
          scope: '#/properties/javascript',
          options: {
            format: 'code',
            language: 'javascript',
            monaco: {
              autoGrow: true,
              minRows: 2,
              maxRows: 10,
              initActions: ['editor.action.formatDocument'],
            },
          },
        },
        {
          type: 'Control',
          label: 'HTML',
          scope: '#/properties/html',
          options: {
            format: 'code',
            language: 'html',
            monaco: { rows: 10, initActions: ['editor.action.formatDocument'] },
          },
        },
        {
          type: 'Control',
          label: 'Select Language Code',
          scope: '#/properties/language',
        },
        {
          // ':language' resolves the language from the form data at runtime, so
          // choosing a language above re-highlights this editor live.
          type: 'Control',
          label: 'Code',
          scope: '#/properties/code',
          options: {
            format: 'code',
            ':language': 'language',
            monaco: { rows: 10, initActions: ['editor.action.formatDocument'] },
          },
        },
        {
          type: 'Control',
          label: 'Document (JSON round-trip)',
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
      javascript: "var test = 'some value';",
      html: '<!DOCTYPE HTML>\n<html>\n  <body>\n    <p>Some HTML content</p>\n  </body>\n</html>',
      language: 'json',
      code: '{\n  "name": "John Doe",\n  "age": 33\n}',
      document: { greeting: 'Hello' },
    },
  },
  {
    name: 'extended-ag-grid',
    label: 'AG Grid',
    schema: {
      type: 'object',
      properties: {
        people: {
          type: 'array',
          title: 'People',
          items: {
            type: 'object',
            required: ['firstName', 'lastName'],
            properties: {
              firstName: { type: 'string', title: 'First name' },
              lastName: { type: 'string', title: 'Last name' },
              age: { type: 'integer', title: 'Age', minimum: 0 },
              role: {
                type: 'string',
                title: 'Role',
                enum: ['Engineer', 'Researcher', 'Leader'],
              },
              favoriteColor: {
                type: 'string',
                format: 'color',
                pattern: '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$',
                title: 'Favorite color',
              },
              tenure: { type: 'string', format: 'duration', title: 'Tenure' },
              date: { type: 'string', format: 'date', title: 'Date' },
              time: { type: 'string', format: 'time', title: 'Time' },
              dateTime: {
                type: 'string',
                format: 'date-time',
                title: 'DateTime',
              },
              active: { type: 'boolean', title: 'Active' },
              address: {
                type: 'object',
                title: 'Address',
                properties: {
                  street: { type: 'string', title: 'Street' },
                  city: { type: 'string', title: 'City' },
                  country: { type: 'string', title: 'Country' },
                  postalCode: { type: 'string', title: 'Postal code' },
                },
              },
              phoneNumbers: {
                type: 'array',
                title: 'Phone numbers',
                items: { type: 'string' },
              },
            },
          },
        },
      },
    },
    uischema: {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/people',
          options: {
            variant: 'ag-grid',
            restrict: true,
            height: 430,
            // The same option the table renderer uses for its up/down
            // buttons; in a grid it adds a drag handle column. Dragging is
            // suppressed while a sort or filter is active, because the
            // visible order would no longer match the data order.
            showSortButtons: true,
            cells: {
              address: {
                summary: { type: 'Control', scope: '#/properties/street' },
                // Adds Clear to the detail dialog: it stages the empty
                // object in the draft, which Apply then commits.
                showEmptyButton: true,
                detail: {
                  type: 'VerticalLayout',
                  elements: [
                    { type: 'Control', scope: '#/properties/street' },
                    {
                      type: 'HorizontalLayout',
                      elements: [
                        { type: 'Control', scope: '#/properties/city' },
                        { type: 'Control', scope: '#/properties/postalCode' },
                      ],
                    },
                    { type: 'Control', scope: '#/properties/country' },
                  ],
                },
              },
              phoneNumbers: {
                summary: { type: 'Control', scope: '#' },
                detail: { type: 'Control', scope: '#' },
              },
            },
            agGridOptions: {
              columnDefs: [
                { field: 'firstName', width: 170 },
                { field: 'lastName', width: 170 },
                { field: 'age', width: 100 },
                { field: 'role', width: 170 },
                { field: 'favoriteColor', width: 190 },
                { field: 'tenure', width: 160 },
                { field: 'date', width: 170 },
                { field: 'time', width: 170 },
                { field: 'dateTime', width: 230 },
                { field: 'active', width: 110, filter: false },
                { field: 'address', width: 240, filter: false },
                { field: 'phoneNumbers', width: 240, filter: false },
              ],
              pagination: true,
              paginationPageSize: 10,
              paginationPageSizeSelector: [10, 20, 50, 100],
            },
          },
        },
      ],
    },
    data: {
      people: [
        {
          firstName: 'Ada',
          lastName: 'Lovelace',
          age: 36,
          role: 'Researcher',
          favoriteColor: '#7c3aed',
          tenure: 'P2Y6M',
          date: '2026-07-18',
          time: '09:30:00Z',
          dateTime: '2026-07-18T09:30:00Z',
          active: true,
          address: {
            street: "12 St James's Square",
            city: 'London',
            country: 'UK',
            postalCode: 'SW1Y',
          },
          phoneNumbers: [
            '+44 20 1234 5678',
            '+44 20 1234 5679',
            '+44 20 1234 5680',
          ],
        },
        {
          firstName: 'Grace',
          lastName: 'Hopper',
          age: 85,
          role: 'Leader',
          favoriteColor: '#0ea5e9cc',
          tenure: 'P5Y',
          date: '2026-07-20',
          time: '14:45:00Z',
          dateTime: '2026-07-20T14:45:00Z',
          active: false,
          address: {
            street: '1 Navy Way',
            city: 'Arlington',
            country: 'USA',
            postalCode: '22201',
          },
          phoneNumbers: ['+1 703 555 0100', '+1 703 555 0101'],
        },
      ],
    },
  },
  {
    name: 'extended-table-cells',
    label: 'Table Cells (scalar & composite)',
    schema: {
      type: 'object',
      properties: {
        people: {
          type: 'array',
          title: 'People',
          items: {
            type: 'object',
            required: ['firstName', 'lastName'],
            properties: {
              firstName: { type: 'string', title: 'First name' },
              lastName: { type: 'string', title: 'Last name' },
              age: { type: 'integer', title: 'Age', minimum: 0 },
              role: {
                type: 'string',
                title: 'Role',
                enum: ['Engineer', 'Researcher', 'Leader'],
              },
              favoriteColor: {
                type: 'string',
                format: 'color',
                pattern: '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$',
                title: 'Favorite color',
              },
              tenure: { type: 'string', format: 'duration', title: 'Tenure' },
              date: { type: 'string', format: 'date', title: 'Date' },
              time: { type: 'string', format: 'time', title: 'Time' },
              dateTime: {
                type: 'string',
                format: 'date-time',
                title: 'DateTime',
              },
              active: { type: 'boolean', title: 'Active' },
              address: {
                type: 'object',
                title: 'Address',
                properties: {
                  street: { type: 'string', title: 'Street' },
                  city: { type: 'string', title: 'City' },
                  country: { type: 'string', title: 'Country' },
                  postalCode: { type: 'string', title: 'Postal code' },
                },
              },
              phoneNumbers: {
                type: 'array',
                title: 'Phone numbers',
                items: { type: 'string' },
              },
            },
          },
        },
      },
    },
    uischema: {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/people',
          options: {
            // Nested address/phoneNumbers make isObjectArrayWithNesting true,
            // so the detail renderer would win on rank. `table: true` forces
            // the table, and `cells` says how each composite column behaves.
            table: true,
            showSortButtons: true,
            cells: {
              address: {
                summary: { type: 'Control', scope: '#/properties/street' },
                showEmptyButton: true,
                detail: {
                  type: 'VerticalLayout',
                  elements: [
                    { type: 'Control', scope: '#/properties/street' },
                    {
                      type: 'HorizontalLayout',
                      elements: [
                        { type: 'Control', scope: '#/properties/city' },
                        { type: 'Control', scope: '#/properties/postalCode' },
                      ],
                    },
                    { type: 'Control', scope: '#/properties/country' },
                  ],
                },
              },
              phoneNumbers: {
                summary: { type: 'Control', scope: '#' },
                detail: { type: 'Control', scope: '#' },
              },
            },
          },
        },
      ],
    },
    data: {
      people: [
        {
          firstName: 'Ada',
          lastName: 'Lovelace',
          age: 36,
          role: 'Researcher',
          favoriteColor: '#7c3aed',
          tenure: 'P2Y6M',
          date: '2026-07-18',
          time: '09:30:00Z',
          dateTime: '2026-07-18T09:30:00Z',
          active: true,
          address: {
            street: "12 St James's Square",
            city: 'London',
            country: 'UK',
            postalCode: 'SW1Y',
          },
          phoneNumbers: [
            '+44 20 1234 5678',
            '+44 20 1234 5679',
            '+44 20 1234 5680',
          ],
        },
        {
          firstName: 'Grace',
          lastName: 'Hopper',
          age: 85,
          role: 'Leader',
          favoriteColor: '#0ea5e9cc',
          tenure: 'P5Y',
          date: '2026-07-20',
          time: '14:45:00Z',
          dateTime: '2026-07-20T14:45:00Z',
          active: false,
          address: {
            street: '1 Navy Way',
            city: 'Arlington',
            country: 'USA',
            postalCode: '22201',
          },
          phoneNumbers: ['+1 703 555 0100', '+1 703 555 0101'],
        },
      ],
    },
  },
]);
