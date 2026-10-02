import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms, withJsonFormsOneOfProps } from '@jsonforms/react';
import { shadcnRenderers, shadcnCells } from '../src';
import { ShadcnAnyOfRenderer } from '../src/complex/AnyOfRenderer';

const SelectedShort = withJsonFormsOneOfProps((props) => (
  <ShadcnAnyOfRenderer {...props} indexOfFittingSchema={0} combinator='oneOf' />
));
it.each([true, false])(
  'honors validateActiveBranch=%s without changing document validity',
  (validateActiveBranch) => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    let documentErrors: unknown[] = [];
    try {
      act(() =>
        root.render(
          <JsonForms
            schema={{
              oneOf: [
                { type: 'string', title: 'Short text', maxLength: 5 },
                { type: 'string', title: 'Long text', minLength: 3 },
              ],
            }}
            data='longer text'
            uischema={{
              type: 'Control',
              scope: '#',
              options: { validateActiveBranch },
            }}
            renderers={[
              ...shadcnRenderers,
              {
                tester: (_ui, schema) => (schema.oneOf ? 100 : -1),
                renderer: SelectedShort,
              },
            ]}
            cells={shadcnCells}
            onChange={({ errors }) => {
              documentErrors = errors ?? [];
            }}
          />
        )
      );
      expect(
        container.textContent?.includes('must NOT have more than 5 characters')
      ).toBe(validateActiveBranch);
      expect(documentErrors).toHaveLength(0);
      expect(Boolean(container.querySelector('[role=alert]'))).toBe(
        validateActiveBranch
      );
    } finally {
      act(() => root.unmount());
      container.remove();
    }
  }
);
