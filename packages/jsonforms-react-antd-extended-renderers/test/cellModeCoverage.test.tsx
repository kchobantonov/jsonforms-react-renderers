import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import {
  antdRenderers,
  antdCells,
  CellModeProvider,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { antdExtendedRenderers } from '../src';

/**
 * Every control must honour cell mode through the shared ControlFormItem.
 * A renderer that draws its own Form.Item keeps its label, which then shows up
 * inside a grid cell - the Tenure/duration column did exactly that.
 */
const cases: { label: string; schema: any }[] = [
  { label: 'Plain text', schema: { type: 'string' } },
  { label: 'Tenure', schema: { type: 'string', format: 'duration' } },
  {
    label: 'Favorite color',
    schema: { type: 'string', format: 'color' },
  },
  { label: 'Date', schema: { type: 'string', format: 'date' } },
  { label: 'Time', schema: { type: 'string', format: 'time' } },
  { label: 'DateTime', schema: { type: 'string', format: 'date-time' } },
  { label: 'Active', schema: { type: 'boolean' } },
  { label: 'Age', schema: { type: 'integer' } },
];

const renderInCell = (label: string, fieldSchema: any) => {
  const schema = { type: 'object', properties: { field: fieldSchema } };
  const uischema = { type: 'Control', scope: '#/properties/field', label };
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <ConfigProvider>
        <CellModeProvider>
          <JsonForms
            data={{}}
            schema={schema as any}
            uischema={uischema as any}
            renderers={[...antdRenderers, ...antdExtendedRenderers]}
            cells={antdCells}
            onChange={() => undefined}
          />
        </CellModeProvider>
      </ConfigProvider>
    )
  );
  const html = container.innerHTML;
  act(() => root.unmount());
  return html;
};

describe('cell mode coverage', () => {
  it.each(cases.map((c) => [c.label, c.schema] as const))(
    '%s renders without its label inside a cell',
    (label, schema) => {
      expect(renderInCell(label, schema)).not.toContain(label);
    }
  );
});
