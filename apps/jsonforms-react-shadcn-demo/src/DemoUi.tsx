import React from 'react';
import {
  DemoButtonProps,
  DemoPanelProps,
  DemoSelectProps,
  DemoTabsProps,
  DemoToggleProps,
  DemoUi,
} from '@chobantonov/jsonforms-react-demo-common';
import {
  Button,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import { ShadcnDemoSplitter } from './ShadcnDemoSplitter';

const DemoButton = ({
  active,
  ariaLabel,
  disabled,
  iconOnly,
  tooltip,
  onClick,
  children,
}: DemoButtonProps) => (
  <Button
    aria-label={ariaLabel}
    variant={active ? 'secondary' : 'outline'}
    size={iconOnly ? 'icon' : 'sm'}
    type='button'
    disabled={disabled}
    title={tooltip}
    onClick={onClick}
  >
    {children}
  </Button>
);

const DemoPanel = ({ className, children }: DemoPanelProps) => (
  <div className={className}>{children}</div>
);

const DemoSelect = ({ label, options, value, onChange }: DemoSelectProps) => {
  const selected = options.find((option) => option.value === value);

  return (
    <label className='demo-ui-field'>
      <span>{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue>{selected?.label}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
};

const DemoTabs = ({ items, value, onChange }: DemoTabsProps) => (
  <Tabs value={value} onValueChange={onChange}>
    <TabsList className='shadcn-demo-tabs-list'>
      {items.map((item) => (
        <TabsTrigger key={item.value} value={item.value}>
          {item.label}
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
);

const DemoToggle = ({
  checked,
  label,
  description,
  onChange,
}: DemoToggleProps) => (
  <label className='shadcn-demo-option'>
    <Checkbox
      checked={checked}
      onCheckedChange={(value) => onChange(value === true)}
    />
    <span>
      <strong>{label}</strong>
      {description && <small>{description}</small>}
    </span>
  </label>
);

export const shadcnDemoUi: DemoUi = {
  Button: DemoButton,
  Panel: DemoPanel,
  Select: DemoSelect,
  Splitter: ShadcnDemoSplitter,
  Tabs: DemoTabs,
  Toggle: DemoToggle,
};
