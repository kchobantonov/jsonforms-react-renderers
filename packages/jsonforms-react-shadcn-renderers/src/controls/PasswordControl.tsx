import {
  and,
  ControlProps,
  formatIs,
  isStringControl,
  optionIs,
  or,
  rankWith,
  schemaMatches,
} from '@jsonforms/core';
import React, { useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@jsonforms-react-shadcn-ui/input';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@jsonforms-react-shadcn-ui/tooltip';
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/translate';
import { InputShell, makeId } from './InputControl';
import { ClearValueButton } from '../components/ClearValueButton';

const isPassword = and(
  isStringControl,
  or(formatIs('password'), optionIs('format', 'password'))
);
export const passwordControlTester = rankWith(4, isPassword);
export const passwordOtpControlTester = rankWith(
  5,
  and(
    isPassword,
    optionIs('variant', 'otp'),
    schemaMatches(
      (schema) =>
        typeof schema.minLength === 'number' &&
        typeof schema.maxLength === 'number' &&
        schema.maxLength > 0
    )
  )
);

/** Shared masking and actions; segmented edits commit partial values immediately. */
export const ShadcnPasswordControl = (
  props: ControlProps & { segmented?: boolean }
) => {
  const [revealed, setRevealed] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const t = useI18n();
  if (!props.visible) return null;
  const {
    data,
    path,
    label,
    schema,
    enabled,
    readonly,
    errors,
    handleChange,
    uischema,
    config,
  } = props;
  const id = makeId(path, label);
  const disabled = !enabled || readonly;
  const value = typeof data === 'string' ? data : '';
  const length = props.segmented ? schema.maxLength! : 1;
  const revealLabel = t(revealed ? 'password.hide' : 'password.show');
  const commit = (next: string) => handleChange(path, next || undefined);
  const focus = (index: number) => {
    const input = inputs.current[Math.max(0, Math.min(length - 1, index))];
    input?.focus();
    input?.select();
  };
  const replace = (index: number, text: string) => {
    const start = Math.min(index, value.length);
    const next = (
      value.slice(0, start) +
      text +
      value.slice(start + text.length)
    ).slice(0, length);
    commit(next);
    focus(start + text.length);
  };
  return (
    <InputShell {...props} id={id}>
      <div className='group relative flex min-w-0 items-center gap-2'>
        <div
          role={props.segmented ? 'group' : undefined}
          aria-label={props.segmented ? label : undefined}
          className={`flex min-w-0 gap-1 overflow-x-auto${
            props.segmented ? '' : ' flex-1'
          }`}
        >
          {Array.from({ length }, (_, index) => (
            <Input
              key={index}
              ref={(element) => {
                inputs.current[index] = element;
              }}
              id={index === 0 ? id : `${id}-${index}`}
              className={
                props.segmented
                  ? 'w-10 shrink-0 px-1 text-center'
                  : 'shadcn-jsonforms-input'
              }
              type={revealed ? 'text' : 'password'}
              disabled={disabled}
              aria-label={
                props.segmented
                  ? `${label || ''} ${index + 1} / ${length}`
                  : undefined
              }
              aria-invalid={Boolean(errors)}
              aria-describedby={errors ? `${id}-errors` : undefined}
              autoComplete={
                props.segmented ? 'one-time-code' : 'current-password'
              }
              value={props.segmented ? value[index] ?? '' : value}
              onFocus={(event) => {
                if (props.segmented) event.currentTarget.select();
              }}
              onChange={(event) => {
                const text = event.currentTarget.value;
                if (!props.segmented) commit(text);
                else if (text) replace(index, text);
                else commit(value.slice(0, index) + value.slice(index + 1));
              }}
              onPaste={
                props.segmented
                  ? (event) => {
                      event.preventDefault();
                      replace(index, event.clipboardData.getData('text'));
                    }
                  : undefined
              }
              onKeyDown={
                props.segmented
                  ? (event) => {
                      if (
                        event.key === 'ArrowLeft' ||
                        event.key === 'ArrowRight'
                      ) {
                        event.preventDefault();
                        focus(index + (event.key === 'ArrowLeft' ? -1 : 1));
                      } else if (
                        event.key === 'Backspace' &&
                        !value[index] &&
                        index > 0
                      ) {
                        event.preventDefault();
                        commit(value.slice(0, index - 1) + value.slice(index));
                        focus(index - 1);
                      }
                    }
                  : undefined
              }
            />
          ))}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='h-7 w-7 shrink-0'
                disabled={disabled}
                aria-label={revealLabel}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setRevealed((v) => !v)}
              >
                {revealed ? (
                  <Eye className='h-4 w-4' />
                ) : (
                  <EyeOff className='h-4 w-4' />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{revealLabel}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className='relative h-10 w-10 shrink-0'>
          <ClearValueButton
            clearable={uischema.options?.clearable ?? config?.clearable ?? true}
            data={data}
            enabled={enabled}
            readonly={readonly}
            onClear={() => commit('')}
          />
        </div>
      </div>
    </InputShell>
  );
};
export const ShadcnPasswordOtpControl = (props: ControlProps) => (
  <ShadcnPasswordControl {...props} segmented />
);
