import type { ControlProps, OwnPropsOfEnum } from '@jsonforms/core';
import type { TranslateProps } from '@jsonforms/react';
import React from 'react';
import { ShadcnEnumControl } from '../../src/controls/EnumControl';
import { renderMarkup } from '../render';

const props = {
  data: undefined,
  description: '',
  enabled: true,
  errors: '',
  handleChange: vi.fn(),
  id: 'status',
  label: 'Status',
  locale: 'en',
  options: [
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ],
  path: 'status',
  required: false,
  rootSchema: { type: 'object' },
  schema: { type: 'string', enum: ['open', 'closed'] },
  t: (id: string, defaultMessage: string | undefined) => defaultMessage ?? id,
  uischema: { type: 'Control', scope: '#/properties/status' },
  visible: true,
} as ControlProps & OwnPropsOfEnum & TranslateProps;

describe('ShadcnEnumControl', () => {
  it('composes the original Shadcn Select primitives in the renderer', () => {
    const markup = renderMarkup(<ShadcnEnumControl {...props} />);

    expect(markup).toContain('role="combobox"');
    expect(markup).toContain('Select...');
    expect(markup).toContain('data-placeholder');
  });

  it('renders a clear value action only for a selected option', () => {
    const selected = renderMarkup(<ShadcnEnumControl {...props} data='open' />);
    const empty = renderMarkup(<ShadcnEnumControl {...props} />);

    expect(selected).toContain('aria-label="Clear value"');
    expect(empty).not.toContain('aria-label="Clear value"');
  });
});
