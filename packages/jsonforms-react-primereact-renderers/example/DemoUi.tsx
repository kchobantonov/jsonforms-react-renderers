import React from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { SelectButton } from 'primereact/selectbutton';
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
  <Button
    outlined={!active}
    disabled={disabled}
    label={String(children)}
    onClick={onClick}
  />
);

const DemoPanel = ({ className, children }: DemoPanelProps) => (
  <Card className={className}>{children}</Card>
);

const DemoSelect = ({ label, options, value, onChange }: DemoSelectProps) => (
  <label className='demo-ui-field'>
    <span>{label}</span>
    <Dropdown
      value={value}
      options={options}
      optionLabel='label'
      optionValue='value'
      onChange={(event) => onChange(event.value)}
    />
  </label>
);

const DemoTabs = ({ items, value, onChange }: DemoTabsProps) => (
  <SelectButton
    value={value}
    options={items}
    optionLabel='label'
    optionValue='value'
    onChange={(event) => event.value && onChange(event.value)}
  />
);

const DemoToggle = ({ checked, label, onChange }: DemoToggleProps) => (
  <label className='checkbox-row'>
    <InputSwitch
      checked={checked}
      onChange={(event) => onChange(Boolean(event.value))}
    />
    {label}
  </label>
);

export const primereactDemoUi: DemoUi = {
  Button: DemoButton,
  Panel: DemoPanel,
  Select: DemoSelect,
  Tabs: DemoTabs,
  Toggle: DemoToggle,
};
