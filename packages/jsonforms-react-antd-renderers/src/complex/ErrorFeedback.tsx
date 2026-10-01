import React from 'react';
import { Button, Popover, Tooltip } from 'antd';
import {
  ErrorSummaryList,
  useErrorSummary,
  useErrorSummaryCount,
} from '@chobantonov/jsonforms-react-renderer-common/errorSummary';

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
  const [open, setOpen] = React.useState(false);
  const count = useErrorSummaryCount(
    local ? '' : errors,
    local ? undefined : path
  );
  const entries = useErrorSummary(errors, path, open && !local);
  if (count <= 1)
    return (
      <Tooltip
        onOpenChange={setOpen}
        trigger={['hover', 'focus']}
        title={
          <span style={{ whiteSpace: 'pre-line' }}>
            {!local && entries[0]
              ? [entries[0].path, entries[0].message].filter(Boolean).join(': ')
              : errors}
          </span>
        }
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
