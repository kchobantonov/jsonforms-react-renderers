import {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import { Box, IconButton, Stack, Tooltip } from '@mui/material';
import React from 'react';
import { MuiAdditionalPropertyItem } from './additionalPropertyUtils';

export interface MuiAdditionalPropertyRowProps {
  cells?: JsonFormsCellRendererRegistryEntry[];
  deleteDisabled: boolean;
  enabled: boolean;
  item: MuiAdditionalPropertyItem;
  onDelete: () => void;
  onRename: () => void;
  readonly?: boolean;
  renderers?: JsonFormsRendererRegistryEntry[];
}

export const MuiAdditionalPropertyRow = ({
  cells,
  deleteDisabled,
  enabled,
  item,
  onDelete,
  onRename,
  readonly,
  renderers,
}: MuiAdditionalPropertyRowProps) => (
  <Box
    className='jsonforms-mui-additional-property'
    sx={{ alignItems: 'flex-start', display: 'flex', gap: 0.5, minWidth: 0 }}
  >
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <JsonFormsDispatch
        cells={cells}
        enabled={enabled}
        path={item.path}
        readonly={readonly}
        renderers={renderers}
        schema={item.schema}
        uischema={item.uischema}
      />
    </Box>
    <Stack direction='row' spacing={0.25} sx={{ pt: 0.5 }}>
      <Tooltip title={`Rename ${item.propertyName}`}>
        <span>
          <IconButton
            aria-label={`Rename ${item.propertyName}`}
            disabled={!enabled || readonly}
            onClick={onRename}
            size='small'
          >
            ✎
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={`Delete ${item.propertyName}`}>
        <span>
          <IconButton
            aria-label={`Delete ${item.propertyName}`}
            color='error'
            disabled={deleteDisabled}
            onClick={onDelete}
            size='small'
          >
            ×
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  </Box>
);
