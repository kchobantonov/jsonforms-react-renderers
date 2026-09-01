import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { FormHelperText, IconButton, Stack, Tooltip } from '@mui/material';
import React from 'react';
import { JsonDataType } from './mixedTypes';

export interface MuiNestedMixedNavigationProps {
  description?: string;
  label?: string;
  onView: () => void;
  selector: React.ReactNode;
  type: JsonDataType;
}

export const MuiNestedMixedNavigation = ({
  description,
  label,
  onView,
  selector,
  type,
}: MuiNestedMixedNavigationProps) => {
  const targetLabel = label?.trim() || (type === 'object' ? 'Object' : 'Array');

  return (
    <Stack className='jsonforms-mui-nested-mixed-navigation' spacing={0.75}>
      <Stack alignItems='flex-start' direction='row' spacing={1}>
        {selector}
        <Tooltip title={`View ${targetLabel}`}>
          <IconButton
            aria-label={`View ${targetLabel}`}
            component='span'
            onClick={(event) => {
              event.stopPropagation();
              onView();
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              event.stopPropagation();
              onView();
            }}
            role='button'
            tabIndex={0}
          >
            <VisibilityOutlinedIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      {description ? <FormHelperText>{description}</FormHelperText> : null}
    </Stack>
  );
};
