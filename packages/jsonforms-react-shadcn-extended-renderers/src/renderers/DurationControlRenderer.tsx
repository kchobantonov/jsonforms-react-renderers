import {
  ControlProps,
  and,
  formatIs,
  isStringControl,
  optionIs,
  or,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import {
  InputShell,
  makeId,
  ClearValueButton,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import {
  useI18n,
  useTranslator,
} from '@chobantonov/jsonforms-react-renderer-common/translate';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import { Input } from '@jsonforms-react-shadcn-ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@jsonforms-react-shadcn-ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jsonforms-react-shadcn-ui/select';
import { Timer, X } from 'lucide-react';
import React from 'react';
import {
  useExtendedTranslator,
  useDurationControl,
  durationFieldMax,
  ExtendedDurationParts,
} from '@chobantonov/jsonforms-react-extended-renderers';

export const durationControlTester = rankWith(
  3,
  and(isStringControl, or(formatIs('duration'), optionIs('format', 'duration')))
);

export const ShadcnDurationControl = (props: ControlProps) => {
  const state = useDurationControl(props);
  const label = useI18n();
  const t = useTranslator();
  const editorText = useExtendedTranslator();
  if (!props.visible) return null;
  const id = makeId(props.path, props.label);
  const unitLabel = (field: keyof ExtendedDurationParts) =>
    label(`duration.${field}` as any);
  return (
    <InputShell {...props}
      id={id}
      label={props.label}
      required={props.required}
      description={props.description}
      errors={state.error}
    >
      <div className='group relative'>
        <Input
          id={id}
          className='pl-10 pr-10'
          value={state.value}
          placeholder={state.options.placeholder ?? 'P1DT2H'}
          autoFocus={state.options.focus}
          disabled={state.disabled}
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? `${id}-errors` : undefined}
          onChange={(event) => state.changeText(event.currentTarget.value)}
        />
        <Popover
          open={state.open}
          onOpenChange={(open) => (open ? state.openPicker() : state.close())}
        >
          <PopoverTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='absolute left-1 top-1 h-8 w-8'
              disabled={state.disabled}
              aria-label={editorText('editor.chooseDuration')}
              title={editorText('editor.chooseDuration')}
            >
              <Timer aria-hidden='true' />
            </Button>
          </PopoverTrigger>
          <PopoverContent align='start' className='w-80 space-y-3'>
            <div className='flex gap-2'>
              {(['components', 'weeks'] as const).map((mode) => (
                <Button
                  type='button'
                  key={mode}
                  variant={state.mode === mode ? 'default' : 'outline'}
                  aria-pressed={state.mode === mode}
                  disabled={state.disabled}
                  onClick={() => state.setMode(mode)}
                >
                  {label(
                    mode === 'weeks'
                      ? 'duration.modeWeeks'
                      : 'duration.modeComponents'
                  )}
                </Button>
              ))}
            </div>
            {state.activeFields.map((field) => (
              <div
                key={field}
                className='grid grid-cols-[1fr_2rem] items-center gap-1'
              >
                <label className='grid grid-cols-2 items-center gap-2'>
                  <Input
                    type='number'
                    min={0}
                    max={durationFieldMax}
                    step={1}
                    value={state.draft[field]}
                    aria-label={unitLabel(field)}
                    disabled={state.disabled}
                    onChange={(event) =>
                      state.changePart(field, Number(event.currentTarget.value))
                    }
                  />
                  <span>{unitLabel(field)}</span>
                </label>
                {state.mode === 'components' &&
                  state.activeFields.length > 1 && (
                    <Button
                      type='button'
                      size='icon'
                      variant='ghost'
                      className='h-8 w-8'
                      disabled={state.disabled}
                      aria-label={label('duration.removeUnit', {
                        unit: unitLabel(field),
                      })}
                      title={label('duration.removeUnit', {
                        unit: unitLabel(field),
                      })}
                      onClick={() => state.removeField(field)}
                    >
                      <X aria-hidden='true' />
                    </Button>
                  )}
              </div>
            ))}
            {state.addableFields.length > 0 && (
              <Select
                value=''
                disabled={state.disabled}
                onValueChange={(field) =>
                  state.addField(field as keyof ExtendedDurationParts)
                }
              >
                <SelectTrigger aria-label={label('duration.addUnit')}>
                  <SelectValue placeholder={label('duration.addUnit')} />
                </SelectTrigger>
                <SelectContent>
                  {state.addableFields.map((field) => (
                    <SelectItem key={field} value={field}>
                      {unitLabel(field)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {state.showActions && (
              <div className='flex justify-end gap-2'>
                <Button type='button' variant='outline' onClick={state.close}>
                  {state.options.cancelLabel
                    ? t(state.options.cancelLabel, state.options.cancelLabel)
                    : label('duration.cancel')}
                </Button>
                <Button
                  type='button'
                  disabled={state.disabled}
                  onClick={state.apply}
                >
                  {state.options.okLabel
                    ? t(state.options.okLabel, state.options.okLabel)
                    : label('duration.ok')}
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
        <ClearValueButton
          clearable={state.options.clearable !== false}
          data={props.data}
          enabled={!state.disabled}
          onClear={() => state.changeText('')}
        />
      </div>
    </InputShell>
  );
};
export const DurationControlRenderer = withJsonFormsControlProps(
  ShadcnDurationControl
);
