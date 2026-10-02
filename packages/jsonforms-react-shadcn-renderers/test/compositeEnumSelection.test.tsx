import React from 'react';
import { expect, it } from 'vitest';
import { ShadcnEnumControl } from '../src/controls/EnumControl';
import { ShadcnRadioGroupControl } from '../src/controls/RadioGroupControl';
import { ShadcnEnumCell } from '../src/cells/EnumCell';
import { renderMarkup } from './render';

it.each([{ mode: 'email', nested: { count: 1 } }, ['email', { count: 1 }]])(
  'matches reloaded composite values in dropdowns, radios and cells: %j',
  (value) => {
    const data = JSON.parse(JSON.stringify(value));
    const props = {
      data,
      schema: { enum: [value] },
      options: [{ value, label: 'Saved choice' }],
      uischema: { type: 'Control', scope: '#' },
      path: 'value',
      label: 'Value',
      visible: true,
      enabled: true,
      errors: '',
      handleChange: () => {},
    } as any;
    expect(renderMarkup(<ShadcnEnumControl {...props} />)).toContain(
      'Saved choice'
    );
    expect(renderMarkup(<ShadcnRadioGroupControl {...props} />)).toContain(
      'aria-checked="true"'
    );
    expect(
      renderMarkup(
        <ShadcnEnumCell
          {...props}
          schema={{ oneOf: [{ const: value, title: 'Saved choice' }] }}
        />
      )
    ).toContain('Saved choice');
    expect(
      renderMarkup(
        <ShadcnRadioGroupControl {...props} data={{ different: true }} />
      )
    ).not.toContain('aria-checked="true"');
  }
);
