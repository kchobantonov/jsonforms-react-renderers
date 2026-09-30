import React from 'react';
import { CircleAlert } from 'lucide-react';
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/translate';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@jsonforms-react-shadcn-ui/tooltip';

export const ContainerValidationIndicator = ({ count }: { count?: number }) => {
  const t = useI18n();
  const label = t(
    count === undefined
      ? 'validation.containerHasErrors'
      : count === 1
      ? 'validation.containerError'
      : 'validation.containerErrors',
    { count }
  );
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role='img'
            aria-label={label}
            tabIndex={0}
            data-container-validation-indicator
            data-error-count={count}
            className='inline-flex shrink-0 items-center text-destructive'
          >
            <CircleAlert className='h-4 w-4' aria-hidden='true' />
          </span>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
