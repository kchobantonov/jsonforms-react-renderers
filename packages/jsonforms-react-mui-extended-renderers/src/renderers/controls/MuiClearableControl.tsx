import CloseIcon from '@mui/icons-material/Close';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { Box, IconButton, Tooltip } from '@mui/material';
import React from 'react';

export const hasClearableValue = (data: unknown) =>
  data !== undefined && data !== null && data !== '';

type MuiClearableControlProps = ControlProps & {
  Renderer: React.ComponentType<any>;
};

export const MuiClearableControl = ({
  Renderer,
  config,
  data,
  enabled,
  handleChange,
  path,
  readonly,
  uischema,
  ...props
}: MuiClearableControlProps) => {
  const clearable = uischema.options?.clearable ?? config?.clearable ?? true;
  const showClear =
    clearable && enabled && !readonly && hasClearableValue(data);

  return (
    <Box
      className='jsonforms-mui-clearable-control'
      sx={{
        position: 'relative',
        '&:hover .jsonforms-mui-clear-value, &:focus-within .jsonforms-mui-clear-value':
          { opacity: 1 },
        ...(showClear
          ? {
              '& .MuiInputBase-root': {
                paddingInlineEnd: '4.5rem !important',
              },
            }
          : {}),
      }}
    >
      <Renderer
        {...props}
        config={config}
        data={data}
        enabled={enabled}
        handleChange={handleChange}
        path={path}
        readonly={readonly}
        uischema={uischema}
      />
      {showClear ? (
        <Tooltip title='Clear value'>
          <IconButton
            aria-label='Clear value'
            className='jsonforms-mui-clear-value'
            onClick={(event) => {
              event.stopPropagation();
              handleChange(path, undefined);
            }}
            onMouseDown={(event) => event.preventDefault()}
            onPointerDown={(event) => event.preventDefault()}
            size='small'
            sx={{
              insetBlockStart: 8,
              insetInlineEnd: 36,
              opacity: 0,
              position: 'absolute',
              transition: (theme) =>
                theme.transitions.create('opacity', {
                  duration: theme.transitions.duration.shortest,
                }),
              zIndex: 2,
            }}
          >
            <CloseIcon fontSize='small' />
          </IconButton>
        </Tooltip>
      ) : null}
    </Box>
  );
};

export const createMuiClearableControl = (Renderer: React.ComponentType<any>) =>
  withJsonFormsControlProps((props: ControlProps) => (
    <MuiClearableControl {...props} Renderer={Renderer} />
  ));
