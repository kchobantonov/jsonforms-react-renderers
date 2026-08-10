import React from 'react';
import {
  Button,
  Card,
  Flex,
  Segmented,
  Select,
  Space,
  Switch,
  Typography,
} from 'antd';
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
    type={active ? 'primary' : 'default'}
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </Button>
);

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
  <Segmented block options={items} value={value} onChange={onChange} />
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
  Tabs: DemoTabs,
  Toggle: DemoToggle,
};
