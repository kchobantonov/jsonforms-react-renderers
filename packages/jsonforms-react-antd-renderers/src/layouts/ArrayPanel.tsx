import React from 'react';
import { Button, Card, CardProps } from 'antd';
import DownOutlined from '@ant-design/icons/DownOutlined';
import UpOutlined from '@ant-design/icons/UpOutlined';
import { useArrayPanelState } from '@chobantonov/jsonforms-react-renderer-common/arrayPanelState';

export const ArrayPanel = ({
  options,
  config,
  panelLabel,
  children,
  extra,
  ...props
}: CardProps & {
  options?: Record<string, any>;
  config?: any;
  panelLabel?: string;
}) => {
  const panel = useArrayPanelState(options, config);
  return (
    <Card
      {...props}
      style={{ minWidth: 0, maxWidth: '100%', ...props.style }}
      extra={
        <>
          {extra}
          {panel.collapsible && (
            <Button
              type='text'
              aria-label={panelLabel || 'Array'}
              aria-expanded={!panel.collapsed}
              aria-controls={panel.contentId}
              onClick={panel.toggle}
              icon={panel.collapsed ? <DownOutlined /> : <UpOutlined />}
            />
          )}
        </>
      }
    >
      <div id={panel.contentId} hidden={panel.collapsed} style={{ minWidth: 0, maxWidth: '100%' }}>
        {children}
      </div>
    </Card>
  );
};
