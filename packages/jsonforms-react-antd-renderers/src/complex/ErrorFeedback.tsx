import React from 'react';
import { Button, Popover, Tooltip } from 'antd';
import {
  ErrorSummaryList,
  useErrorFeedback,
} from '@chobantonov/jsonforms-react-renderer-common/validation/errorSummary';

export const ErrorFeedback = ({
  errors,
  path,
  children,
  local = false,
}: React.PropsWithChildren<{
  errors: string;
  path?: string;
  local?: boolean;
}>) => {
  const { setOpen, count, entries, message } = useErrorFeedback(
    errors,
    path,
    local,
  );
  if (count <= 1)
    return (
      <Tooltip
        onOpenChange={setOpen}
        trigger={['hover', 'focus']}
        title={<span style={{ whiteSpace: 'pre-line' }}>{message}</span>}
      >
        {children}
      </Tooltip>
    );
  return (
    <Popover
      onOpenChange={setOpen}
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
