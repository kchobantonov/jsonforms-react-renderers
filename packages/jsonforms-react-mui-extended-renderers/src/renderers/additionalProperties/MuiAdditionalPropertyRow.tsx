import {
  CoreActions,
  UPDATE_DATA,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import {
  JsonFormsContext,
  JsonFormsDispatch,
  useJsonForms,
} from '@jsonforms/react';
import { Box, IconButton, Stack, Tooltip } from '@mui/material';
import React, { useCallback, useMemo } from 'react';
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
}: MuiAdditionalPropertyRowProps) => {
  const context = useJsonForms();
  const dispatch = useCallback(
    (action: CoreActions) => {
      if (action.type === UPDATE_DATA && action.path === item.path) {
        context.dispatch?.({
          ...action,
          updater: (previous: unknown) => {
            const next = action.updater(previous);
            // JSON Forms removes keys on undefined. Dynamic keys are removed only
            // by the row's Delete action; value controls use type-specific empties.
            if (next !== undefined) return next;
            if (typeof previous === 'string') return '';
            if (typeof previous === 'number') return 0;
            if (typeof previous === 'boolean') return false;
            if (Array.isArray(previous)) return [];
            if (previous && typeof previous === 'object') return {};
            return null;
          },
        });
      } else {
        context.dispatch?.(action);
      }
    },
    [context.dispatch, item.path]
  );
  const propertyContext = useMemo(
    () => ({ ...context, dispatch }),
    [context, dispatch]
  );
  return (
    <Box
      className='jsonforms-mui-additional-property'
      sx={{ alignItems: 'flex-start', display: 'flex', gap: 0.5, minWidth: 0 }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <JsonFormsContext.Provider value={propertyContext}>
          <JsonFormsDispatch
            cells={cells}
            enabled={enabled}
            path={item.path}
            readonly={readonly}
            renderers={renderers}
            schema={item.schema}
            uischema={item.uischema}
          />
        </JsonFormsContext.Provider>
      </Box>
      <Stack
        className='jsonforms-mui-additional-property-actions'
        direction='column'
        spacing={0.25}
        sx={{ flexShrink: 0 }}
      >
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
};
