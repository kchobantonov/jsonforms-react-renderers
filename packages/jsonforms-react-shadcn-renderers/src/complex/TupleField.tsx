import React from 'react';
import {
  TupleField as CommonTupleField,
  type TupleFieldProps,
} from '@chobantonov/jsonforms-react-renderer-common/tuple/TupleField';
export type { TupleFieldProps } from '@chobantonov/jsonforms-react-renderer-common/tuple/TupleField';
import { CompositeDetailDialog } from '../cells/CompositeDetailDialog';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import { Pencil } from 'lucide-react';
export function TupleField(props: TupleFieldProps) {
  return (
    <CommonTupleField
      {...props}
      CompositeDetailDialog={CompositeDetailDialog}
      gap={8}
      legendStyle={{ marginBottom: 4, fontSize: 14, color: 'inherit' }}
      renderEditButton={(label, disabled, open) => (
        <Button
          size='icon-sm'
          type='button'
          variant='ghost'
          disabled={disabled}
          onClick={open}
          title={label}
          aria-label={label}
        >
          <Pencil className='h-4 w-4' />
        </Button>
      )}
      renderError={(message, draft) => (
        <span
          className='text-destructive'
          role='alert'
          data-tuple-draft={draft || undefined}
        >
          {message}
        </span>
      )}
    />
  );
}
