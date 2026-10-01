import React from 'react';
import { CircleAlert } from 'lucide-react';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@jsonforms-react-shadcn-ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@jsonforms-react-shadcn-ui/popover';
import {
  ErrorSummaryList,
  useErrorSummary,
  useErrorSummaryCount,
} from '@chobantonov/jsonforms-react-renderer-common/errorSummary';

export const ErrorIndicator = ({
  errors,
  className,
  path,
  local = false,
}: {
  errors: string;
  className?: string;
  path?: string;
  local?: boolean;
}) => {
  const [open, setOpen] = React.useState(false);
  const count = useErrorSummaryCount(
    local ? '' : errors,
    local ? undefined : path
  );
  const entries = useErrorSummary(errors, path, open && !local);
  const timer = React.useRef<ReturnType<typeof setTimeout>>();
  const trigger = React.useRef<HTMLButtonElement>(null);
  const content = React.useRef<HTMLDivElement>(null);
  const cancelClose = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const show = () => {
    cancelClose();
    setOpen(true);
  };
  const scheduleClose = () => {
    cancelClose();
    timer.current = setTimeout(() => {
      if (
        trigger.current !== document.activeElement &&
        !content.current?.contains(document.activeElement)
      )
        setOpen(false);
    }, 200);
  };
  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  if (count <= 1)
    return (
      <TooltipProvider>
        <Tooltip onOpenChange={setOpen}>
          <TooltipTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              className={`h-6 w-6 shrink-0 p-0 text-destructive ${
                className ?? ''
              }`}
              aria-label={errors}
            >
              <CircleAlert className='h-4 w-4' aria-hidden='true' />
            </Button>
          </TooltipTrigger>
          <TooltipContent className='max-w-sm whitespace-pre-line'>
            {!local && entries[0]
              ? [entries[0].path, entries[0].message].filter(Boolean).join(': ')
              : errors}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          ref={trigger}
          onPointerEnter={show}
          onPointerLeave={scheduleClose}
          onFocus={show}
          onBlur={scheduleClose}
          onClick={(event) => {
            event.preventDefault();
            show();
          }}
          className={`h-6 w-6 shrink-0 p-0 text-destructive ${className ?? ''}`}
          aria-label={errors}
        >
          <CircleAlert className='h-4 w-4' aria-hidden='true' />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className='w-auto'
        align='start'
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onPointerEnter={cancelClose}
        onPointerLeave={scheduleClose}
        onFocusCapture={cancelClose}
        onBlurCapture={scheduleClose}
      >
        <div ref={content}>
          <ErrorSummaryList
            entries={entries}
            renderToggle={(label, toggle, expanded) => (
              <Button
                type='button'
                variant='link'
                onClick={toggle}
                aria-expanded={expanded}
              >
                {label}
              </Button>
            )}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
