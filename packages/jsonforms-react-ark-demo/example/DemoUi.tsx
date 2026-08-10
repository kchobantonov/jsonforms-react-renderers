/// <reference path='../../jsonforms-react-ark-renderers/src/ark-ui-react-factory.d.ts' />

import React from 'react';
import { ark } from '@ark-ui/react/factory';
import {
  DemoButtonProps,
  DemoPanelProps,
  DemoSelectProps,
  DemoTabsProps,
  DemoToggleProps,
  DemoUi,
} from '../../jsonforms-react-demo-common/src/App';

const DemoButton = ({
  active,
  disabled,
  onClick,
  children,
}: DemoButtonProps) => (
  <ark.button
    className='ark-jsonforms-button'
    data-active={active ? '' : undefined}
    type='button'
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </ark.button>
);

const DemoPanel = ({ className, children }: DemoPanelProps) => (
  <ark.div className={className}>{children}</ark.div>
);

const DemoSelect = ({ label, options, value, onChange }: DemoSelectProps) => (
  <ark.label className='demo-ui-field'>
    <ark.span>{label}</ark.span>
    <ark.select
      className='ark-jsonforms-input'
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </ark.select>
  </ark.label>
);

const DemoTabs = ({ items, value, onChange }: DemoTabsProps) => (
  <ark.div className='ark-jsonforms-tabs' role='tablist'>
    {items.map((item) => (
      <ark.button
        key={item.value}
        className='ark-jsonforms-tab'
        data-active={item.value === value ? '' : undefined}
        type='button'
        onClick={() => onChange(item.value)}
      >
        {item.label}
      </ark.button>
    ))}
  </ark.div>
);

const DemoToggle = ({ checked, label, onChange }: DemoToggleProps) => (
  <ark.label className='ark-jsonforms-checkbox'>
    <ark.input
      type='checkbox'
      checked={checked}
      onChange={(event) => onChange(event.currentTarget.checked)}
    />
    <ark.span>{label}</ark.span>
  </ark.label>
);

export const arkDemoUi: DemoUi = {
  Button: DemoButton,
  Panel: DemoPanel,
  Select: DemoSelect,
  Tabs: DemoTabs,
  Toggle: DemoToggle,
};
