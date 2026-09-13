import CloseIcon from '@mui/icons-material/Close';
import { ControlProps, OwnPropsOfControl } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { Box, IconButton, Tooltip } from '@mui/material';
import React, { useLayoutEffect, useRef, useState } from 'react';

export const hasClearableValue = (data: unknown) =>
  data !== undefined && data !== null && data !== '';

type MuiClearableControlProps = ControlProps & {
  Renderer: React.ComponentType<any>;
  rendererProps?: OwnPropsOfControl;
};

export const MuiClearableControl = ({
  Renderer,
  rendererProps,
  config,
  data,
  enabled,
  handleChange,
  path,
  readonly,
  uischema,
  ...props
}: MuiClearableControlProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [inputCenter, setInputCenter] = useState<number>();
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    let input: HTMLElement | null = null;
    const measure = () => {
      const next = wrapper.querySelector<HTMLElement>(
        '.MuiInputBase-root, .MuiPickersInputBase-root'
      );
      if (input !== next) {
        if (input) resizeObserver?.unobserve(input);
        input = next;
        if (input) resizeObserver?.observe(input);
      }
      if (!input) {
        setInputCenter(undefined);
        return;
      }
      const bounds = input.getBoundingClientRect();
      setInputCenter(
        bounds.top - wrapper.getBoundingClientRect().top + bounds.height / 2
      );
    };
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(measure);
    resizeObserver?.observe(wrapper);
    // Date pickers can replace their input when committing typed values.
    const mutations = new MutationObserver(measure);
    mutations.observe(wrapper, { childList: true, subtree: true });
    measure();
    window.addEventListener('resize', measure);
    return () => {
      resizeObserver?.disconnect();
      mutations.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  const clearable = uischema.options?.clearable ?? config?.clearable ?? true;
  const showClear =
    clearable && enabled && !readonly && hasClearableValue(data);

  return (
    <Box
      ref={wrapperRef}
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
        {...(rendererProps ?? {
          ...props,
          config,
          data,
          enabled,
          handleChange,
          path,
          readonly,
          uischema,
        })}
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
              top: inputCenter ?? '50%',
              transform: 'translateY(-50%)',
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

export const createMuiClearableControl = (
  Renderer: React.ComponentType<any>
) => {
  const Clearable = withJsonFormsControlProps(
    (props: ControlProps & { rendererProps: OwnPropsOfControl }) => (
      <MuiClearableControl {...props} Renderer={Renderer} />
    )
  );
  // Material renderers are already connected. Give them the original schema and
  // parent path so that they resolve the control exactly once.
  return (props: OwnPropsOfControl) => (
    <Clearable {...{ ...props, rendererProps: props }} />
  );
};
