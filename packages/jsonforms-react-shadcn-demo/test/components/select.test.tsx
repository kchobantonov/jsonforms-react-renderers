import React from 'react';
import { renderMarkup } from '../render';
import { JsonFormsSelect } from '../../example/components/jsonforms/select-adapter';

describe('Shadcn Select adapter', () => {
  it('composes the individual upstream Select components', () => {
    const markup = renderMarkup(
      <JsonFormsSelect
        onValueChange={() => undefined}
        options={[{ label: 'One', value: 'one' }]}
        placeholder='Choose'
        value=''
      />
    );
    expect(markup).toContain('role="combobox"');
    expect(markup).toContain('Choose');
  });
});
