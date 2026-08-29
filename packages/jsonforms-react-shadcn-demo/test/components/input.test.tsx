import React from 'react';
import { renderMarkup } from '../render';
import { JsonFormsInput } from '../../example/components/jsonforms/input-adapter';
import { Input } from '../../example/components/ui/input';

describe('Shadcn Input', () => {
  it('keeps the upstream component and JSON Forms class adaptation separate', () => {
    expect(renderMarkup(<Input type='email' />)).toContain(
      'placeholder:text-muted-foreground'
    );
    expect(renderMarkup(<JsonFormsInput type='email' />)).toContain(
      'shadcn-jsonforms-input'
    );
  });
});
