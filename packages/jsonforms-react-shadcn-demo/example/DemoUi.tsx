import React from 'react';
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
  <button
    className='shadcn-jsonforms-button'
    data-active={active ? '' : undefined}
    type='button'
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </button>
);

const DemoPanel = ({ className, children }: DemoPanelProps) => (
  <div className={className}>{children}</div>
);

const DemoSelect = ({ label, options, value, onChange }: DemoSelectProps) => (
  <label className='demo-ui-field'>
    <span>{label}</span>
    <select
      className='shadcn-jsonforms-input'
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const DemoTabs = ({ items, value, onChange }: DemoTabsProps) => (
  <div className='shadcn-jsonforms-tabs' role='tablist'>
    {items.map((item) => (
      <button
        key={item.value}
        className='shadcn-jsonforms-tab'
        data-active={item.value === value ? '' : undefined}
        type='button'
        onClick={() => onChange(item.value)}
      >
        {item.label}
      </button>
    ))}
  </div>
);

const DemoToggle = ({ checked, label, onChange }: DemoToggleProps) => (
  <label className='shadcn-jsonforms-checkbox'>
    <input
      type='checkbox'
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
    <span>{label}</span>
  </label>
);

export const shadcnDemoUi: DemoUi = {
  Button: DemoButton,
  Panel: DemoPanel,
  Select: DemoSelect,
  Tabs: DemoTabs,
  Toggle: DemoToggle,
};
