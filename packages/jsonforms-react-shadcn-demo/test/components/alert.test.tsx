import React from 'react';
import { renderMarkup } from '../render';
import { JsonFormsAlert } from '../../example/components/jsonforms/alert-adapter';
import { Alert } from '../../example/components/ui/alert';

describe('Shadcn Alert', () => {
  it('keeps the upstream component separate from the JSON Forms adapter', () => {
    expect(renderMarkup(<Alert>Message</Alert>)).toContain('role="alert"');
    expect(
      renderMarkup(
        <JsonFormsAlert variant='destructive'>Message</JsonFormsAlert>
      )
    ).toContain('shadcn-jsonforms-alert-destructive');
  });
});
