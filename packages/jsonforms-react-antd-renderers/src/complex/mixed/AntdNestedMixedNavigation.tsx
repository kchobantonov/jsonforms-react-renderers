import { useI18n } from '../../util/translate';
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
}) => {
  const t = useI18n();
  return (
    <Flex className='jsonforms-mixed-nested-navigation' vertical gap={4}>
      {label ? <Typography.Text>{label}</Typography.Text> : null}
      <Flex align='center' gap='small'>
        {selector}
        <Tooltip
          title={t('mixed.view', { label: label || t('control.value') })}
        >
          <Button
            aria-label={t('mixed.view', { label: label || t('control.value') })}
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
};
