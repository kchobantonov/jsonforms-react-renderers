import React from 'react';
import {
  Button,
  Card,
  Flex,
  Select,
  Space,
  Switch,
  Tooltip,
  Tabs,
  Typography,
} from 'antd';
import {
  DemoButtonProps,
  DemoPanelProps,
  DemoSelectProps,
  DemoTabsProps,
  DemoToggleProps,
  DemoUi,
} from '@chobantonov/jsonforms-react-demo-common';
import { AntdDemoSplitter } from './AntdDemoSplitter';

const DemoButton = ({
  active,
  ariaLabel,
  disabled,
  iconOnly,
  tooltip,
  onClick,
  children,
}: DemoButtonProps) => {
  const button = (
    <Button
      aria-label={ariaLabel}
      type={active ? 'primary' : 'default'}
      disabled={disabled}
      shape={iconOnly ? 'circle' : 'default'}
      onClick={onClick}
    >
      {children}
    </Button>
  );

  return tooltip ? <Tooltip title={tooltip}>{button}</Tooltip> : button;
};

const DemoPanel = ({ className, children }: DemoPanelProps) => (
  <Card className={className}>{children}</Card>
);

const DemoSelect = ({ label, options, value, onChange }: DemoSelectProps) => (
  <Flex vertical gap='small'>
    <Typography.Text>{label}</Typography.Text>
    <Select value={value} options={options} onChange={onChange} />
  </Flex>
);

const DemoTabs = ({ items, value, onChange }: DemoTabsProps) => (
  <Tabs
    activeKey={value}
    items={items.map((item) => ({ key: item.value, label: item.label }))}
    onChange={onChange}
    tabBarGutter={28}
  />
);

const DemoToggle = ({ checked, label, onChange }: DemoToggleProps) => (
  <Space>
    <Switch checked={checked} onChange={onChange} />
    <Typography.Text>{label}</Typography.Text>
  </Space>
);

export const antdDemoUi: DemoUi = {
  Button: DemoButton,
  Panel: DemoPanel,
  Select: DemoSelect,
  Splitter: AntdDemoSplitter,
  Tabs: DemoTabs,
  Toggle: DemoToggle,
};
