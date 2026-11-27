import { DetailModal } from '../complex/DetailModal';
import React from 'react';
import { Splitter, Empty, Button, Tooltip } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import {
  type RowDetailState,
  createRowDetailToggle,
  createRowDetailFrame,
} from '@chobantonov/jsonforms-react-renderer-common/collections/rowDetail';
const RowDialog = ({ state }: { state: RowDetailState }) => {
  const { options, t } = state;
  return (
    <DetailModal
      options={options.dialog}
      open={!!state.selection}
      title={t('collection.editDetails')}
      onCancel={state.close}
      onOk={state.apply}
      okText={t('composite.apply')}
      cancelText={t('composite.cancel')}
      okButtonProps={{ disabled: !state.enabled || state.conflict }}
      styles={{ body: { maxHeight: '65vh', overflow: 'auto' } }}
    >
      {state.conflict && <p role='alert'>{t('composite.applyConflict')}</p>}
      {state.content}
    </DetailModal>
  );
};
const RowPanel = ({
  state,
  children,
}: React.PropsWithChildren<{ state: RowDetailState }>) => {
  const { options, panelOpen, t } = state;
  return (
    <div>
      <Splitter
        orientation={options.placement === 'bottom' ? 'vertical' : 'horizontal'}
        style={{
          height: panelOpen
            ? options.placement === 'bottom'
              ? '40rem'
              : '32rem'
            : 'auto',
          maxWidth: '100%',
        }}
      >
        <Splitter.Panel
          defaultSize='55%'
          min='20%'
          resizable={options.resizable !== false}
        >
          <div
            style={{
              height: panelOpen ? '100%' : undefined,
              minWidth: 0,
              minHeight: 0,
              overflow: 'auto',
            }}
          >
            {children}
          </div>
        </Splitter.Panel>
        {panelOpen && (
          <Splitter.Panel min='20%' resizable={options.resizable !== false}>
            <div
              style={{
                padding: 12,
                height: '100%',
                minWidth: 0,
                minHeight: 0,
                overflow: 'auto',
              }}
            >
              {state.content ?? (
                <Empty description={t('collection.selectItem')} />
              )}
            </div>
          </Splitter.Panel>
        )}
      </Splitter>
    </div>
  );
};

export const RowDetailFrame = createRowDetailFrame(RowDialog, RowPanel);

export const RowDetailToggle = createRowDetailToggle((toggle) => (
  <div style={{ display: 'inline-flex' }}>
    <Tooltip title={toggle.label}>
      <Button
        shape='circle'
        aria-label={toggle.label}
        aria-expanded={toggle.expanded}
        icon={toggle.expanded ? <EyeInvisibleOutlined /> : <EyeOutlined />}
        onClick={toggle.toggle}
      />
    </Tooltip>
  </div>
));
