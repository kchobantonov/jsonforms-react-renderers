import React from 'react';
import { Button, Popover, Tooltip } from 'antd';
import {
  ErrorSummaryList,
  useErrorSummary,
} from '@chobantonov/jsonforms-react-renderer-common/errorSummary';

export const ErrorFeedback = ({
  errors,
  path,
  children,
}: React.PropsWithChildren<{ errors: string; path?: string }>) => {
  const entries = useErrorSummary(errors, path);
  if (entries.length <= 1)
    return (
      <Tooltip
        trigger={['hover', 'focus']}
        title={<span style={{ whiteSpace: 'pre-line' }}>{errors}</span>}
      >
        {children}
      </Tooltip>
    );
  return (
    <Popover
      trigger={['hover', 'focus', 'click']}
      content={
        <ErrorSummaryList
          entries={entries}
          renderToggle={(label, toggle, expanded) => (
            <Button type='link' onClick={toggle} aria-expanded={expanded}>
              {label}
            </Button>
          )}
        />
      }
    >
      {children}
    </Popover>
  );
};
