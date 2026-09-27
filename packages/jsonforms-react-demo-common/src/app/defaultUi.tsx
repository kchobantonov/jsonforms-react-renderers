import React from 'react';
import type {
  DemoButtonProps,
  DemoPanelProps,
  DemoSelectProps,
  DemoTabsProps,
  DemoToggleProps,
  DemoUi,
} from './types';

/**
 * Plain HTML versions of everything the demo needs from a renderer set.
 *
 * A renderer family supplies its own - antd's, here - but the demo has to run
 * without one, and these are also the readable statement of what the contract
 * actually requires: a button, a panel, a select, tabs and a toggle.
 */
const DefaultButton = ({
  active,
  ariaLabel,
  disabled,
  iconOnly,
  tooltip,
  onClick,
  children,
}: DemoButtonProps) => (
  <button
    aria-label={ariaLabel}
    className={`demo-button${active ? ' active' : ''}${
      iconOnly ? ' icon-only' : ''
    }`}
    type='button'
    disabled={disabled}
    title={tooltip}
    onClick={onClick}
  >
    {children}
  </button>
);

const DefaultPanel = ({ className = '', children }: DemoPanelProps) => (
  <div className={className}>{children}</div>
);

const DefaultSelect = ({
  label,
  options,
  value,
  onChange,
}: DemoSelectProps) => (
  <label>
    {label}
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const DefaultTabs = ({ items, value, onChange }: DemoTabsProps) => (
  <div className='tab-list'>
    {items.map((item) => (
      <DefaultButton
        key={item.value}
        active={item.value === value}
        onClick={() => onChange(item.value)}
      >
        {item.label}
      </DefaultButton>
    ))}
  </div>
);

const DefaultToggle = ({
  checked,
  label,
  description,
  onChange,
}: DemoToggleProps) => (
  <label className='checkbox-row'>
    <input
      type='checkbox'
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
    <span>
      <strong>{label}</strong>
      {description && <small>{description}</small>}
    </span>
  </label>
);

export const defaultDemoUi: DemoUi = {
  Button: DefaultButton,
  Panel: DefaultPanel,
  Select: DefaultSelect,
  Tabs: DefaultTabs,
  Toggle: DefaultToggle,
};
