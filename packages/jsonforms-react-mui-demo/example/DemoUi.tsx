import React from 'react';
import {
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Tabs,
} from '@mui/material';
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
    variant={active ? 'contained' : 'outlined'}
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </Button>
);

const DemoPanel = ({ className, children }: DemoPanelProps) => (
  <Paper className={className} variant='outlined'>
    {children}
  </Paper>
);

const DemoSelect = ({ label, options, value, onChange }: DemoSelectProps) => (
  <FormControl fullWidth size='small'>
    <InputLabel>{label}</InputLabel>
    <Select
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

const DemoTabs = ({ items, value, onChange }: DemoTabsProps) => (
  <Tabs
    value={value}
    variant='scrollable'
    onChange={(_event, nextValue) => onChange(nextValue)}
  >
    {items.map((item) => (
      <Tab key={item.value} value={item.value} label={item.label} />
    ))}
  </Tabs>
);

const DemoToggle = ({ checked, label, onChange }: DemoToggleProps) => (
  <FormControlLabel
    label={label}
    control={
      <Switch
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    }
  />
);

export const muiDemoUi: DemoUi = {
  Button: DemoButton,
  Panel: DemoPanel,
  Select: DemoSelect,
  Tabs: DemoTabs,
  Toggle: DemoToggle,
};
