import EyeOutlined from '@ant-design/icons/EyeOutlined';
import { Button, Flex, Tooltip, Typography } from 'antd';
import React from 'react';

export const AntdNestedMixedNavigation = ({
  description,
  label,
  onView,
  selector,
}: {
  description?: string;
  label?: string;
  onView: () => void;
  selector: React.ReactNode;
}) => (
  <Flex className='jsonforms-mixed-nested-navigation' vertical gap={4}>
    {label ? <Typography.Text>{label}</Typography.Text> : null}
    <Flex align='center' gap='small'>
      {selector}
      <Tooltip title={`View ${label || 'value'}`}>
        <Button
          aria-label={`View ${label || 'value'}`}
          icon={<EyeOutlined />}
          onClick={onView}
          size='small'
        />
      </Tooltip>
    </Flex>
    {description ? (
      <Typography.Text type='secondary'>{description}</Typography.Text>
    ) : null}
  </Flex>
);
