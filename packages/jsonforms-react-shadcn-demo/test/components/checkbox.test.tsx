import React from 'react';
import { renderMarkup } from '../render';
import { JsonFormsCheckbox } from '../../example/components/jsonforms/checkbox-adapter';
import { Checkbox } from '../../example/components/ui/checkbox';

describe('Shadcn Checkbox', () => {
  it('renders the upstream primitive through the JSON Forms adapter', () => {
    expect(renderMarkup(<Checkbox checked />)).toContain(
      'data-state="checked"'
    );
    expect(renderMarkup(<JsonFormsCheckbox checked />)).toContain(
      'shadcn-jsonforms-checkbox-control'
    );
  });
});
