import React from 'react';
import {
  TupleField as CommonTupleField,
  type TupleFieldProps,
} from '@chobantonov/jsonforms-react-renderer-common/tuple/TupleField';
export type { TupleFieldProps } from '@chobantonov/jsonforms-react-renderer-common/tuple/TupleField';
import { CompositeDetailDialog } from '../cells/CompositeDetailDialog';
import { Button, Typography, theme as antTheme } from 'antd';
import EditOutlined from '@ant-design/icons/EditOutlined';
export function TupleField(props: TupleFieldProps) {
  const { token } = antTheme.useToken();
  return (
    <CommonTupleField
      {...props}
      CompositeDetailDialog={CompositeDetailDialog}
      gap={token.paddingXS}
      legendStyle={{
        marginBottom: token.paddingXXS,
        fontSize: token.fontSize,
        color: token.colorTextHeading,
      }}
      renderEditButton={(label, disabled, open) => (
        <Button
          size='small'
          type='text'
          icon={<EditOutlined />}
          disabled={disabled}
          onClick={open}
          title={label}
          aria-label={label}
        />
      )}
      renderError={(message, draft) => (
        <Typography.Text
          type={draft ? 'warning' : 'danger'}
          role='alert'
          data-tuple-draft={draft || undefined}
        >
          {message}
        </Typography.Text>
      )}
    />
  );
}
