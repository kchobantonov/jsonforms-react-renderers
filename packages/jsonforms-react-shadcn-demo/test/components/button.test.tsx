import React from 'react';
import { renderMarkup } from '../render';
import { JsonFormsButton } from '../../example/components/jsonforms/button-adapter';
import { Button } from '../../example/components/ui/button';

describe('Shadcn Button', () => {
  it('keeps upstream variants and applies JSON Forms compatibility separately', () => {
    expect(renderMarkup(<Button variant='outline'>Edit</Button>)).toContain(
      'border-input'
    );

    const adapter = renderMarkup(
      <JsonFormsButton variant='outline'>Edit</JsonFormsButton>
    );
    expect(adapter).toContain('type="button"');
    expect(adapter).toContain('shadcn-jsonforms-button-outline');
  });
});
