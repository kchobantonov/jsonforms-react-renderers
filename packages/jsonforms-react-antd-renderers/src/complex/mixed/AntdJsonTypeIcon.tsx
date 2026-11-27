import {
  useI18n,
  useTranslator,
} from '@chobantonov/jsonforms-react-renderer-common/locale/translate';
import AlignLeftOutlined from '@ant-design/icons/AlignLeftOutlined';
import CheckOutlined from '@ant-design/icons/CheckOutlined';
import CodeOutlined from '@ant-design/icons/CodeOutlined';
import StopOutlined from '@ant-design/icons/StopOutlined';
import React from 'react';

const typeIcons = new Map<string, React.ReactNode>([
  ['array', '[]'],
  ['object', '{}'],
  ['string', <AlignLeftOutlined key='AlignLeftOutlined' />],
  ['integer', '#'],
  ['number', '#'],
  ['boolean', <CheckOutlined key='CheckOutlined' />],
  ['null', <StopOutlined key='StopOutlined' />],
]);

export const AntdJsonTypeIcon = ({ type }: { type: string | null }) => {
  const t = useI18n();
  const translate = useTranslator();
  const label = t('mixed.typedValue', {
    type: translate(`mixed.type.${type ?? 'unknown'}`, type ?? 'unknown'),
  });
  const icon = typeIcons.get(type ?? 'unknown') ?? <CodeOutlined />;

  return (
    <span
      aria-label={label}
      className='jsonforms-mixed-tree-type-icon'
      role='img'
      style={{ fontFamily: 'monospace', fontWeight: 600 }}
      title={label}
    >
      {icon}
    </span>
  );
};
