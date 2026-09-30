import React from 'react';
import { Modal, Splitter, Empty } from 'antd';
import { RowDetailState } from '@chobantonov/jsonforms-react-renderer-common/rowDetail';
export const RowDetailFrame = ({
  state,
  children,
}: React.PropsWithChildren<{ state: RowDetailState }>) => {
  const { options, t } = state;
  if (!options) return <>{children}</>;
  if (options.presentation === 'dialog')
    return (
      <>
        {children}
        <Modal
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
        </Modal>
      </>
    );
  return (
    <Splitter
      orientation={options.placement === 'bottom' ? 'vertical' : 'horizontal'}
      style={{
        height: options.placement === 'bottom' ? '40rem' : '32rem',
        maxWidth: '100%',
      }}
    >
      <Splitter.Panel
        defaultSize='55%'
        min='20%'
        resizable={options.resizable !== false}
      >
        {children}
      </Splitter.Panel>
      <Splitter.Panel min='20%' resizable={options.resizable !== false}>
        <div style={{ padding: 12 }}>
          {state.content ?? <Empty description={t('collection.selectItem')} />}
        </div>
      </Splitter.Panel>
    </Splitter>
  );
};
