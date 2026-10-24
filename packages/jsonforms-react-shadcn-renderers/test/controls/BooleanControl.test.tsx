import type { ControlProps } from '@jsonforms/core';
import React from 'react';
import { ShadcnBooleanControl } from '../../src/controls/BooleanControl';
import { renderMarkup } from '../render';

const props = {
  data: true,
  description: '',
  enabled: true,
  errors: '',
  handleChange: vi.fn(),
  id: 'enabled',
  label: 'Enabled',
  path: 'enabled',
  required: false,
  rootSchema: { type: 'object' },
  schema: { type: 'boolean' },
  uischema: { type: 'Control', scope: '#/properties/enabled' },
  visible: true,
} as ControlProps;

describe('ShadcnBooleanControl', () => {
  it('renders the original Shadcn checkbox without a component provider', () => {
    const markup = renderMarkup(<ShadcnBooleanControl {...props} />);

    expect(markup).toContain('role="checkbox"');
    expect(markup).toContain('data-state="checked"');
    expect(markup).toContain('Yes');
  });
});
