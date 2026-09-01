import type { ControlProps } from '@jsonforms/core';
import React from 'react';
import {
  ShadcnInputControl,
  ShadcnNumberControl,
} from '../../src/controls/InputControl';
import { renderMarkup } from '../render';

const props = {
  data: 'Ada',
  description: 'Your name',
  enabled: true,
  errors: '',
  handleChange: vi.fn(),
  id: 'name',
  label: 'Name',
  path: 'name',
  required: true,
  rootSchema: { type: 'object' },
  schema: { type: 'string' },
  uischema: { type: 'Control', scope: '#/properties/name' },
  visible: true,
} as ControlProps;

describe('ShadcnInputControl', () => {
  it('renders the original Shadcn input without a component provider', () => {
    const markup = renderMarkup(<ShadcnInputControl {...props} />);

    expect(markup).toContain('value="Ada"');
    expect(markup).toContain('border-input');
    expect(markup).toContain('aria-label="Clear value"');
  });

  it('does not render clear for empty, disabled, or opted-out controls', () => {
    expect(
      renderMarkup(<ShadcnInputControl {...props} data={undefined} />)
    ).not.toContain('aria-label="Clear value"');
    expect(
      renderMarkup(<ShadcnInputControl {...props} enabled={false} />)
    ).not.toContain('aria-label="Clear value"');
    expect(
      renderMarkup(
        <ShadcnInputControl
          {...props}
          uischema={{
            ...props.uischema,
            options: { clearable: false },
          }}
        />
      )
    ).not.toContain('aria-label="Clear value"');
  });

  it('treats zero as populated numeric data', () => {
    const markup = renderMarkup(
      <ShadcnNumberControl {...props} data={0} schema={{ type: 'number' }} />
    );

    expect(markup).toContain('aria-label="Clear value"');
  });
});
