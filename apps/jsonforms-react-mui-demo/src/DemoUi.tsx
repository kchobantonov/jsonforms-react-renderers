import React from 'react';
import {
  Box,
  Button,
  Divider,
  IconButton,
  FormHelperText,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Tabs,
  Tooltip,
} from '@mui/material';
import {
  DemoButtonProps,
  DemoPanelProps,
  DemoSelectProps,
  DemoTabsProps,
  DemoToggleProps,
  DemoUi,
} from '@chobantonov/jsonforms-react-demo-common';
import { MuiDemoTypography } from './MuiDemoTypography';
import { MuiDemoTextInput } from './MuiDemoTextInput';
import { MuiDemoSegmentedControl } from './MuiDemoSegmentedControl';
import { MuiDemoSplitter } from './MuiDemoSplitter';

const DemoButton = ({
  active,
  ariaLabel,
  disabled,
  iconOnly,
  tooltip,
  onClick,
  children,
}: DemoButtonProps) => {
  const button = iconOnly ? (
    <IconButton
      aria-label={ariaLabel ?? tooltip}
      aria-pressed={active}
      color={active ? 'primary' : 'default'}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </IconButton>
  ) : (
    <Button
      aria-label={ariaLabel}
      variant={active ? 'contained' : 'outlined'}
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
    >
      {children}
    </Button>
  );

  return tooltip ? <Tooltip title={tooltip}>{button}</Tooltip> : button;
};

const DemoPanel = ({ className, children }: DemoPanelProps) => {
  if (className?.split(/\s+/).includes('form-card')) {
    return (
      <Box
        className={className}
        sx={{
          '&&': { border: 0, borderRadius: 0, background: 'transparent', p: 0 },
          minWidth: 0,
        }}
      >
        {children}
      </Box>
    );
  }
  return (
    <Paper className={className} variant='outlined'>
      {children}
    </Paper>
  );
};

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

const DemoToggle = ({
  checked,
  label,
  description,
  onChange,
}: DemoToggleProps) => (
  <FormControl>
    <FormControlLabel
      label={label}
      control={
        <Switch
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
      }
    />
    {description && <FormHelperText>{description}</FormHelperText>}
  </FormControl>
);

export const muiDemoUi: DemoUi = {
  Typography: MuiDemoTypography,
  TextInput: MuiDemoTextInput,
  SegmentedControl: MuiDemoSegmentedControl,
  Divider,
  Button: DemoButton,
  Panel: DemoPanel,
  Select: DemoSelect,
  Splitter: MuiDemoSplitter,
  Tabs: DemoTabs,
  Toggle: DemoToggle,
};
