import CloseIcon from '@mui/icons-material/Close';
import { ControlProps, OwnPropsOfControl } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import {
  Box,
  IconButton,
  Tooltip,
  ThemeProvider,
  useTheme,
} from '@mui/material';
import React, { useLayoutEffect, useRef, useState, useMemo } from 'react';

export const hasClearableValue = (data: unknown) =>
  data !== undefined && data !== null && data !== '';

type MuiClearableControlProps = ControlProps & {
  Renderer: React.ComponentType<any>;
  rendererProps?: OwnPropsOfControl;
  nativeClear?: 'text' | 'autocomplete';
};

export const MuiClearableControl = ({
  Renderer,
  nativeClear,
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
  const clearable = uischema.options?.clearable ?? config?.clearable ?? true;
  const showClear =
    clearable && enabled && !readonly && hasClearableValue(data);
  const useNativeClear =
    nativeClear === 'text' ||
    (nativeClear === 'autocomplete' &&
      (uischema.options?.autocomplete ?? config?.autocomplete) !== false);
  const showCustomClear = showClear && !useNativeClear;
  const theme = useTheme();
  const clearableTheme = useMemo(
    () => ({
      ...theme,
      components: {
        ...theme.components,
        MuiAutocomplete: {
          ...theme.components?.MuiAutocomplete,
          defaultProps: {
            ...theme.components?.MuiAutocomplete?.defaultProps,
            disableClearable: !(useNativeClear && showClear),
            clearText: 'Clear value',
          },
        },
      },
    }),
    [theme, useNativeClear, showClear]
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [inputCenter, setInputCenter] = useState<number>();
  useLayoutEffect(() => {
    if (useNativeClear) return;
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
  }, [useNativeClear]);

  return (
    <Box
      ref={wrapperRef}
      className='jsonforms-mui-clearable-control'
      sx={{
        position: 'relative',
        '&:hover .jsonforms-mui-clear-value, &:focus-within .jsonforms-mui-clear-value':
          { opacity: 1 },
        ...(nativeClear === 'text'
          ? {
              // Upstream provides the adornment and click handler. Apply our policy
              // and keyboard-focus visibility, preserving its native positioning and padding.
              '& .MuiInputAdornment-root:has(button[aria-label="Clear input field"])':
                {
                  display: 'none !important',
                },
              ...(showClear
                ? {
                    '&:hover .MuiInputAdornment-root:has(button[aria-label="Clear input field"]), &:focus-within .MuiInputAdornment-root:has(button[aria-label="Clear input field"])':
                      {
                        display: 'flex !important',
                      },
                  }
                : {}),
            }
          : {}),
        ...(showCustomClear
          ? {
              '& .MuiInputBase-root': {
                paddingInlineEnd: '4.5rem !important',
              },
            }
          : {}),
      }}
    >
      {/* Keep native clear actions where available and apply the shared policy. */}
      <ThemeProvider theme={clearableTheme}>
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
      </ThemeProvider>
      {showCustomClear ? (
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
  Renderer: React.ComponentType<any>,
  nativeClear?: 'text' | 'autocomplete'
) => {
  const Clearable = withJsonFormsControlProps(
    (props: ControlProps & { rendererProps: OwnPropsOfControl }) => (
      <MuiClearableControl
        {...props}
        Renderer={Renderer}
        nativeClear={nativeClear}
      />
    )
  );
  // Material renderers are already connected. Give them the original schema and
  // parent path so that they resolve the control exactly once.
  return (props: OwnPropsOfControl) => (
    <Clearable {...{ ...props, rendererProps: props }} />
  );
};
