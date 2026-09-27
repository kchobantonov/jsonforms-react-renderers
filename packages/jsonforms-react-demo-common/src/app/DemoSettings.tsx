import React from 'react';
import { LaptopMinimalCheck, Moon, Sun } from 'lucide-react';
import type { ValidationMode } from '@jsonforms/core';
import type { DemoLayout, DemoMode } from '../demoPreferences';
import type { DemoUi } from '../App';
import { DefaultDemoTextInput } from '../DefaultDemoTextInput';
import { DefaultDemoTypography } from '../DefaultDemoTypography';

/**
 * The settings drawer.
 *
 * Lifted out of `App` unchanged. It is two hundred lines of switches that read
 * and write the demo's own preferences and never touch a form, so it has no
 * business sharing a component with the routing, the editors and the
 * JSON Forms wiring - which is what made `App` a thousand lines long.
 *
 * Every value it needs is a prop, deliberately: the settings are *the* place
 * where "what is this demo currently doing" is visible, and a hook hiding half
 * of them behind a context would make that harder to read rather than easier.
 */
export interface DemoSettingsPanelProps {
  Ui: DemoUi;
  ProviderSettings?: React.ComponentType<any>;
  mode: DemoMode;
  setMode: (mode: DemoMode) => void;
  rtl: boolean;
  setRtl: (rtl: boolean) => void;
  locale: string;
  setLocale: (locale: string) => void;
  validationMode: ValidationMode;
  setValidationMode: (mode: ValidationMode) => void;
  layout: DemoLayout;
  setLayout: (layout: DemoLayout) => void;
  readonly: boolean;
  changeReadonly: (value: boolean) => void;
  configOptions: Record<string, any>;
  setConfigOption: (key: string, value: unknown) => void;
  effectiveConfigOption: (key: string) => boolean;
  rendererSettings: Record<string, any>;
  setRendererSettings: (settings: Record<string, any>) => void;
  dark: boolean;
  /** The example's own `config`, which a few switches fall back to. */
  exampleConfig?: Record<string, unknown>;
}

export const DemoSettingsPanel = ({
  Ui,
  ProviderSettings,
  mode,
  setMode,
  rtl,
  setRtl,
  locale,
  setLocale,
  validationMode,
  setValidationMode,
  layout,
  setLayout,
  readonly,
  changeReadonly,
  configOptions,
  setConfigOption,
  effectiveConfigOption,
  rendererSettings,
  setRendererSettings,
  dark,
  exampleConfig,
}: DemoSettingsPanelProps) => {
  const {
    Button: UiButton,
    Select: UiSelect,
    Toggle: UiToggle,
    Typography: UiTypography = DefaultDemoTypography,
    TextInput: UiTextInput = DefaultDemoTextInput,
    SegmentedControl: UiSegmentedControl,
    Divider: UiDivider,
  } = Ui;

  return (
    <div className='demo-settings'>
      {UiSegmentedControl ? (
        <UiSegmentedControl
          label='Mode'
          value={mode}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          onChange={(value) => setMode(value as DemoMode)}
        />
      ) : (
        <div className='demo-setting-field'>
          <span className='demo-setting-label'>Mode</span>
          <div className='demo-segmented-control'>
            {(['system', 'light', 'dark'] as const).map((value) => (
              <UiButton
                key={value}
                active={mode === value}
                onClick={() => setMode(value)}
              >
                {value === 'system' ? (
                  <LaptopMinimalCheck aria-hidden='true' />
                ) : value === 'light' ? (
                  <Sun aria-hidden='true' />
                ) : (
                  <Moon aria-hidden='true' />
                )}
                {value[0].toUpperCase() + value.slice(1)}
              </UiButton>
            ))}
          </div>
        </div>
      )}
      {UiSegmentedControl ? (
        <UiSegmentedControl
          label='Direction'
          value={rtl ? 'rtl' : 'ltr'}
          options={[
            { value: 'ltr', label: 'LTR' },
            { value: 'rtl', label: 'RTL' },
          ]}
          onChange={(value) => setRtl(value === 'rtl')}
        />
      ) : (
        <div className='demo-setting-field'>
          <span className='demo-setting-label'>Direction</span>
          <div className='demo-segmented-control'>
            <UiButton active={!rtl} onClick={() => setRtl(false)}>
              LTR
            </UiButton>
            <UiButton active={rtl} onClick={() => setRtl(true)}>
              RTL
            </UiButton>
          </div>
        </div>
      )}
      {UiDivider ? <UiDivider /> : <div className='demo-settings-separator' />}
      <UiSelect
        label='Locale'
        value={locale}
        options={[
          { value: 'en', label: 'English' },
          { value: 'de', label: 'German' },
          { value: 'bg', label: 'Bulgarian' },
          { value: navigator.language, label: 'Browser language' },
        ]}
        onChange={setLocale}
      />
      <UiSelect
        label='Validation'
        value={validationMode}
        options={[
          { value: 'ValidateAndShow', label: 'Validate and show' },
          { value: 'ValidateAndHide', label: 'Validate and hide' },
          { value: 'NoValidation', label: 'No validation' },
        ]}
        onChange={(value) => setValidationMode(value as ValidationMode)}
      />
      <UiSelect
        label='Demo Layout'
        value={layout}
        options={[
          { value: 'default', label: 'Default' },
          { value: 'demo-and-data', label: 'Demo and Data' },
        ]}
        onChange={(value) => setLayout(value as DemoLayout)}
      />
      {UiDivider ? <UiDivider /> : <div className='demo-settings-separator' />}
      <UiTypography component='h3' className='demo-settings-section-title'>
        Options
      </UiTypography>
      <UiToggle
        checked={effectiveConfigOption('hideRequiredAsterisk')}
        label='Hide Required Asterisk'
        description='Hide asterisks in labels for required fields.'
        onChange={(value) => setConfigOption('hideRequiredAsterisk', value)}
      />
      <UiToggle
        checked={effectiveConfigOption('showUnfocusedDescription')}
        label='Show Unfocused Description'
        description='Keep input descriptions visible while controls are unfocused.'
        onChange={(value) => setConfigOption('showUnfocusedDescription', value)}
      />
      <UiToggle
        checked={effectiveConfigOption('restrict')}
        label='Restrict'
        description='Enforce schema length and array size restrictions.'
        onChange={(value) => setConfigOption('restrict', value)}
      />
      <UiToggle
        checked={readonly}
        label='Read-Only'
        description='Set all controls to read-only.'
        onChange={changeReadonly}
      />
      <UiToggle
        checked={effectiveConfigOption('collapseNewItems')}
        label='Collapse new array items'
        description='Do not expand newly added array items.'
        onChange={(value) => setConfigOption('collapseNewItems', value)}
      />
      <UiToggle
        checked={effectiveConfigOption('hideArraySummaryValidation')}
        label='Hide array summary validation'
        description='Hide validation summaries in array headers.'
        onChange={(value) =>
          setConfigOption('hideArraySummaryValidation', value)
        }
      />
      <UiToggle
        checked={effectiveConfigOption('initCollapsed')}
        label='Collapse arrays initially'
        description='Start array accordions collapsed.'
        onChange={(value) => setConfigOption('initCollapsed', value)}
      />
      <UiToggle
        checked={effectiveConfigOption('hideAvatar')}
        label='Hide Array Item Avatar'
        description='Hide array index avatars.'
        onChange={(value) => setConfigOption('hideAvatar', value)}
      />
      <UiToggle
        checked={effectiveConfigOption('enableFilterErrorsBeforeTouch')}
        label='Enable Filter Errors Before Touch'
        description='Hide selected validation errors until a control is touched.'
        onChange={(value) =>
          setConfigOption('enableFilterErrorsBeforeTouch', value)
        }
      />
      <UiTextInput
        label='Filter Error Keywords Before Touch'
        value={(
          configOptions.filterErrorKeywordsBeforeTouch ??
          (exampleConfig as Record<string, unknown> | undefined)
            ?.filterErrorKeywordsBeforeTouch ??
          []
        ).join(', ')}
        placeholder='required, minLength'
        description='Separate AJV keywords with commas.'
        onChange={(value) =>
          setConfigOption(
            'filterErrorKeywordsBeforeTouch',
            value
              .split(',')
              .map((keyword) => keyword.trim())
              .filter(Boolean)
          )
        }
      />
      <UiToggle
        checked={effectiveConfigOption('allowAdditionalPropertiesIfMissing')}
        label='Allow Additional Properties By Default'
        description='Allow properties when the schema does not explicitly configure them.'
        onChange={(value) =>
          setConfigOption('allowAdditionalPropertiesIfMissing', value)
        }
      />
      <UiToggle
        checked={effectiveConfigOption('allowEmptyPropertyNames')}
        label='Allow Empty Property Names'
        description={
          'Permit empty and whitespace-only names for dynamic properties; ' +
          'names are stored exactly as typed. A control can override this ' +
          'with options.allowEmptyPropertyNames, including false over this.'
        }
        onChange={(value) => setConfigOption('allowEmptyPropertyNames', value)}
      />
      {ProviderSettings && (
        <div className='provider-settings'>
          <ProviderSettings
            settings={rendererSettings}
            setSettings={setRendererSettings}
            dark={dark}
            mode={mode}
            rtl={rtl}
          />
        </div>
      )}
    </div>
  );
};
