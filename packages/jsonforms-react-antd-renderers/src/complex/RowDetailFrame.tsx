import { DetailModal } from '../complex/DetailModal';
import React from 'react';
import { Splitter, Empty, Button, Tooltip } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { RowDetailState } from '@chobantonov/jsonforms-react-renderer-common/rowDetail';
export const RowDetailFrame = ({
  state,
  children,
}: React.PropsWithChildren<{ state: RowDetailState }>) => {
  const { options, t } = state;
  const { panelOpen } = state;
  if (!options) return <>{children}</>;
  if (options.presentation === 'dialog')
    return (
      <>
        {children}
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
      </>
    );
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

export const RowDetailToggle = ({ state }: { state: RowDetailState }) => {
  const { panelOpen, setPanelOpen, t, options } = state;
  if (options?.presentation !== 'panel') return null;
  const toggleLabel = t(
    panelOpen ? 'collection.hideDetails' : 'collection.showDetails'
  );
  return (
    <div style={{ display: 'inline-flex' }}>
      <Tooltip title={toggleLabel}>
        <Button
          shape='circle'
          aria-label={toggleLabel}
          aria-expanded={panelOpen}
          icon={panelOpen ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          onClick={() => setPanelOpen((open) => !open)}
        />
      </Tooltip>
    </div>
  );
};
