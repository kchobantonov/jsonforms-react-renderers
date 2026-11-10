import React from 'react';
import Editor from '@monaco-editor/react';
import { RotateCcw, Save } from 'lucide-react';
import { defaultDemoUi } from './defaultUi';
import { DefaultDemoTypography } from '../DefaultDemoTypography';
import type { DemoUi } from './types';

export function parseExternal(
  value: string,
): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(value);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed) ||
      !parsed.settings ||
      typeof parsed.settings !== 'object' ||
      Array.isArray(parsed.settings)
    )
      return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export const ExternalEditor = ({
  value,
  locale,
  dark = false,
  onChange,
  Ui = defaultDemoUi,
  onReload,
}: {
  value: string;
  locale: string;
  dark?: boolean;
  Ui?: DemoUi;
  onReload?: () => void;
  onChange: (text: string, parsed?: Record<string, unknown>) => void;
}) => {
  const id = React.useId();
  const bg = locale === 'bg';
  const valid = !!parseExternal(value);
  const { Panel, Button, Typography = DefaultDemoTypography } = Ui;
  const reload = bg
    ? 'Възстановяване на първоначалните външни данни'
    : 'Reload original external values';
  const apply = bg ? 'Прилагане на външните данни' : 'Apply external changes';
  return (
    <Panel className='editor-panel panel'>
      <div className='editor-heading'>
        <Typography component='h2'>
          {bg ? 'Външни данни' : 'External'}
        </Typography>
        <div className='action-row'>
          <Button
            ariaLabel={reload}
            iconOnly
            tooltip={reload}
            disabled={!onReload}
            onClick={onReload}
          >
            <RotateCcw aria-hidden='true' />
            <span className='sr-only'>{reload}</span>
          </Button>
          <Button
            ariaLabel={apply}
            iconOnly
            tooltip={apply}
            disabled={!valid}
            onClick={() => {
              if (valid) onChange(value, parseExternal(value));
            }}
          >
            <Save aria-hidden='true' />
            <span className='sr-only'>{apply}</span>
          </Button>
        </div>
      </div>
      <p id={`${id}-hint`} className='sr-only'>
        {bg
          ? 'Редактирайте external. Валидният JSON се прилага веднага. settings трябва да е обект.'
          : 'Edit external. Valid JSON applies immediately. Keep settings as an object; other namespaces are preserved.'}
      </p>
      <Editor
        height='68vh'
        defaultLanguage='json'
        theme={dark ? 'vs-dark' : 'light'}
        value={value}
        options={{ ariaLabel: bg ? 'Външни данни' : 'External' }}
        onChange={(text) => onChange(text ?? '', parseExternal(text ?? ''))}
      />
      {!valid && (
        <p role='alert'>
          {bg
            ? 'Невалиден обект. Прегледът запазва последната валидна стойност.'
            : 'Enter a JSON object with a settings object. The preview keeps the last valid value.'}
        </p>
      )}
    </Panel>
  );
};
