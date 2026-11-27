import type { ControlProps } from '@jsonforms/core';
import React from 'react';
import {
  ShadcnInputControl,
  ShadcnNumberControl,
} from '../../src/controls/InputControl';
import { ShadcnPasswordControl } from '../../src/controls/PasswordControl';
import { renderMarkup } from '../support/render';

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

  it('composes adornments within the field chrome around input and clear controls', () => {
    const markup = renderMarkup(
      <ShadcnInputControl
        {...props}
        uischema={{
          ...props.uischema,
          options: {
            startAdornment: '€',
            endAdornment: [
              { kind: 'text', text: 'kg' },
              {
                kind: 'icon',
                icon: 'information',
                label: 'Help',
                tooltip: 'About weight',
              },
            ],
          },
        }}
      />,
    );
    expect(markup).toContain('data-input-adornments');
    expect(markup.indexOf('data-adornment="start"')).toBeLessThan(
      markup.indexOf('value="Ada"'),
    );
    expect(markup.indexOf('aria-label="Clear value"')).toBeLessThan(
      markup.lastIndexOf('data-adornment="end"'),
    );
    expect(markup).toContain('var(--jf-end-adornment-space, 0px)');
    expect(markup).toContain('aria-label="Help"');
    expect(markup).toContain('About weight');
  });

  it('keeps password reveal and clear controls inside the bordered input before the end adornment', () => {
    const markup = renderMarkup(
      <ShadcnPasswordControl
        {...props}
        data='secret'
        uischema={{ ...props.uischema, options: { endAdornment: 'secure' } }}
      />,
    );
    expect(markup).toContain('shadcn-jsonforms-input pr-20');
    expect(markup).toContain('end-1 my-auto h-7 w-7');
    expect(markup).toContain('end-11 my-auto h-9 w-9');
    expect(markup.indexOf('aria-label="Show password"')).toBeLessThan(
      markup.indexOf('data-adornment="end"'),
    );
    expect(markup.indexOf('aria-label="Clear value"')).toBeLessThan(
      markup.indexOf('data-adornment="end"'),
    );
  });

  it('does not render clear for empty, disabled, or opted-out controls', () => {
    expect(
      renderMarkup(<ShadcnInputControl {...props} data={undefined} />),
    ).not.toContain('aria-label="Clear value"');
    expect(
      renderMarkup(<ShadcnInputControl {...props} enabled={false} />),
    ).not.toContain('aria-label="Clear value"');
    expect(
      renderMarkup(
        <ShadcnInputControl
          {...props}
          uischema={{
            ...props.uischema,
            options: { clearable: false },
          }}
        />,
      ),
    ).not.toContain('aria-label="Clear value"');
  });

  it('treats zero as populated numeric data', () => {
    const markup = renderMarkup(
      <ShadcnNumberControl {...props} data={0} schema={{ type: 'number' }} />,
    );

    expect(markup).toContain('aria-label="Clear value"');
    expect(markup).toContain('padding-inline-end: 64px');
    expect(markup).toContain('var(--jf-end-adornment-space, 0px) + 24px');
  });
});
