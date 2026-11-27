import React from 'react';
import { TriangleAlert, CircleAlert } from 'lucide-react';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@jsonforms-react-shadcn-ui/popover';
export const FileFeedback = ({
  message,
  cell,
  severity,
}: {
  message: string;
  cell?: boolean;
  severity: 'warning' | 'error';
}) => {
  const [open, setOpen] = React.useState(false);
  const color =
    severity === 'warning'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-destructive';
  const Icon = severity === 'warning' ? TriangleAlert : CircleAlert;
  return cell ? (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className={'h-6 w-6 shrink-0 ' + color}
          aria-label={message}
          onMouseEnter={() => setOpen(true)}
          onFocus={() => setOpen(true)}
        >
          <Icon className='h-4 w-4' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        className='max-w-sm text-sm'
      >
        {message}
      </PopoverContent>
    </Popover>
  ) : (
    <div role='alert' className={'text-sm ' + color}>
      {message}
    </div>
  );
};
