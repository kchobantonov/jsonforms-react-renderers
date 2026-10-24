import React from 'react';
import { Alert, Skeleton } from 'antd';

/** Placeholder while a lazily loaded control (Monaco, AG Grid) is fetched. */
export const AntdEditorLoading = ({ label }: { label?: string }) => (
  <Skeleton.Node active style={{ width: '100%', height: 120 }}>
    <span style={{ fontSize: 12 }}>{label}</span>
  </Skeleton.Node>
);

export const AntdEditorLoadError = ({ label }: { label?: string }) => (
  <Alert type='error' showIcon message={label} />
);
