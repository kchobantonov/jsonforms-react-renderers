import React from 'react';
import { Modal, Button, Tooltip } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import {
  useDetailDialog,
  DetailDialogOptions,
} from '@chobantonov/jsonforms-react-renderer-common/detailDialog';
import { useTranslator } from '@chobantonov/jsonforms-react-renderer-common/translate';

export const DetailModal = ({
  options = {},
  ...props
}: React.ComponentProps<typeof Modal> & { options?: DetailDialogOptions }) => {
  const geometry = useDetailDialog(!!props.open, options);
  const t = useTranslator();
  const surface = React.useRef<HTMLDivElement>(null);
  const [restoredWidth, setRestoredWidth] = React.useState<string>();
  React.useEffect(() => {
    if (!props.open) setRestoredWidth(undefined);
  }, [props.open]);
  const toggle = () => {
    if (!geometry.maximized) {
      // Native CSS resizing writes an inline width on the content container.
      const container = surface.current
        ?.firstElementChild as HTMLElement | null;
      if (container?.style.width) setRestoredWidth(container.style.width);
    }
    geometry.toggle();
  };
  const styles =
    typeof props.styles === 'function' ? props.styles({ props }) : props.styles;
  const label = geometry.maximized
    ? t('dialog.restore', 'Restore dialog')
    : t('dialog.maximize', 'Maximize dialog');
  return (
    <Modal
      {...props}
      width={geometry.style.width ?? props.width}
      style={{
        ...props.style,
        top: geometry.maximized ? 16 : undefined,
        paddingBottom: 0,
      }}
      styles={{
        ...styles,
        container: {
          ...styles?.container,
          width: geometry.maximized ? '100%' : restoredWidth,
          resize: geometry.style.resize,
          minWidth: 280,
          minHeight: 160,
          maxWidth: geometry.style.maxWidth,
          height: geometry.style.height,
          maxHeight: geometry.style.maxHeight,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
        body: {
          ...styles?.body,
          flex: '1 1 auto',
          minHeight: 0,
          maxHeight: undefined,
          overflow: 'auto',
        },
        header: { ...styles?.header, flexShrink: 0 },
        footer: {
          ...styles?.footer,
          flexShrink: 0,
          marginTop: 'auto',
          paddingTop: 12,
          textAlign: 'end',
        },
      }}
      modalRender={(node) => (
        <div ref={surface} style={{ translate: geometry.style.translate }}>
          {node}
        </div>
      )}
      title={
        <div
          {...geometry.dragProps}
          style={{ ...geometry.dragProps.style, paddingRight: 56 }}
        >
          {props.title}
          {options.maximizable !== false && (
            <Tooltip title={label}>
              <Button
                type='text'
                aria-label={label}
                style={{ position: 'absolute', right: 48, top: 12 }}
                icon={
                  geometry.maximized ? (
                    <FullscreenExitOutlined />
                  ) : (
                    <FullscreenOutlined />
                  )
                }
                onClick={toggle}
              />
            </Tooltip>
          )}
        </div>
      }
    />
  );
};
