import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@jsonforms-react-shadcn-ui/tooltip';
import React from 'react';
import {
  DemoButtonProps,
  DemoPanelProps,
  DemoSelectProps,
  DemoTabsProps,
  DemoToggleProps,
  DemoUi,
} from '@chobantonov/jsonforms-react-demo-common';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import { Checkbox } from '@jsonforms-react-shadcn-ui/checkbox';
import { Select } from '@jsonforms-react-shadcn-ui/select';
import { SelectContent } from '@jsonforms-react-shadcn-ui/select';
import { SelectItem } from '@jsonforms-react-shadcn-ui/select';
import { SelectTrigger } from '@jsonforms-react-shadcn-ui/select';
import { SelectValue } from '@jsonforms-react-shadcn-ui/select';
import { Tabs } from '@jsonforms-react-shadcn-ui/tabs';
import { TabsList } from '@jsonforms-react-shadcn-ui/tabs';
import { TabsTrigger } from '@jsonforms-react-shadcn-ui/tabs';

import { ShadcnDemoSplitter } from './ShadcnDemoSplitter';

const DemoButton = ({
  active,
  ariaLabel,
  disabled,
  iconOnly,
  tooltip,
  onClick,
  children,
}: DemoButtonProps): React.JSX.Element => (
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
  Tooltip: ({ content, children }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
  Button: DemoButton,
  Panel: DemoPanel,
  Select: DemoSelect,
  Splitter: ShadcnDemoSplitter,
  Tabs: DemoTabs,
  Toggle: DemoToggle,
};
