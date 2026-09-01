import { CacheProvider } from '@emotion/react';
import createCache, { EmotionCache } from '@emotion/cache';
import { JsonForms } from '@jsonforms/react';
import type { ValidationMode } from '@jsonforms/core';
import {
  createJsonFormsMuiTheme,
  HandleActionContext,
  MuiRendererSettings,
} from '@chobantonov/jsonforms-react-mui-extended-renderers';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { muiWebcomponentCells, muiWebcomponentRenderers } from './renderers';

export const JSON_FORMS_MUI_TAG = 'jsonforms-react-mui';

export type JsonInput = unknown;

export const parseJson = (value: JsonInput) => {
  if (typeof value !== 'string') {
    return value;
  }
  if (value.trim() === '') {
    return undefined;
  }
  return JSON.parse(value);
};

export const parseBoolean = (value: JsonInput) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    if (value === '' || value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return undefined;
};

export const parseNumber = (value: JsonInput) => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

export const parseMode = (value: JsonInput) =>
  value === 'dark' || value === 'light' || value === 'system'
    ? value
    : 'system';

export const createTranslator = (translations: JsonInput, locale = 'en') => {
  const dictionary = parseJson(translations) as any;
  return (id: string, defaultMessage: string | undefined) => {
    const value = dictionary?.[locale]?.[id] ?? dictionary?.[id];
    if (typeof value === 'string') return value;
    if (typeof value?.label === 'string') return value.label;
    return defaultMessage ?? id;
  };
};

type ElementState = {
  data?: JsonInput;
  schema?: JsonInput;
  uischema?: JsonInput;
  uischemas?: JsonInput;
  config?: JsonInput;
  readonly?: JsonInput;
  validationMode?: ValidationMode;
  locale?: string;
  translations?: JsonInput;
  additionalErrors?: JsonInput;
  dark?: JsonInput;
  mode?: JsonInput;
  rtl?: JsonInput;
  customStyle?: string;
  rendererSettings?: JsonInput;
  inputVariant?: MuiRendererSettings['inputVariant'];
  density?: MuiRendererSettings['density'];
  primaryColor?: string;
  borderRadius?: JsonInput;
  fontFamily?: string;
  disableAnimations?: JsonInput;
};

const observedAttributes = [
  'data',
  'schema',
  'uischema',
  'uischemas',
  'config',
  'readonly',
  'validation-mode',
  'locale',
  'translations',
  'additional-errors',
  'dark',
  'mode',
  'rtl',
  'custom-style',
  'renderer-settings',
  'input-variant',
  'density',
  'primary-color',
  'border-radius',
  'font-family',
  'disable-animations',
];

export class JsonFormsMuiElement extends HTMLElement {
  static get observedAttributes() {
    return observedAttributes;
  }

  private root?: Root;
  private cache?: EmotionCache;
  private state: ElementState = {
    validationMode: 'ValidateAndShow',
    locale: 'en',
    mode: 'system',
    readonly: false,
    customStyle: '',
  };

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (!this.shadowRoot) return;
    this.cache = createCache({
      key: 'jsonforms-react-mui',
      container: this.shadowRoot,
      prepend: true,
    });
    this.root = createRoot(this.shadowRoot);
    this.render();
  }

  disconnectedCallback() {
    this.root?.unmount();
    this.root = undefined;
    this.cache = undefined;
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    this.setValue(name, newValue);
  }

  set data(value: JsonInput) {
    this.setValue('data', value);
  }
  set schema(value: JsonInput) {
    this.setValue('schema', value);
  }
  set uischema(value: JsonInput) {
    this.setValue('uischema', value);
  }
  set uischemas(value: JsonInput) {
    this.setValue('uischemas', value);
  }
  set config(value: JsonInput) {
    this.setValue('config', value);
  }
  set readonly(value: JsonInput) {
    this.setValue('readonly', value);
  }
  set validationMode(value: ValidationMode) {
    this.setValue('validationMode', value);
  }
  set locale(value: string) {
    this.setValue('locale', value);
  }
  set translations(value: JsonInput) {
    this.setValue('translations', value);
  }
  set additionalErrors(value: JsonInput) {
    this.setValue('additionalErrors', value);
  }
  set dark(value: JsonInput) {
    this.setValue('dark', value);
  }
  set mode(value: JsonInput) {
    this.setValue('mode', value);
  }
  set rtl(value: JsonInput) {
    this.setValue('rtl', value);
  }
  set customStyle(value: string) {
    this.setValue('customStyle', value);
  }
  set rendererSettings(value: JsonInput) {
    this.setValue('rendererSettings', value);
  }
  set inputVariant(value: MuiRendererSettings['inputVariant']) {
    this.setValue('inputVariant', value);
  }
  set density(value: MuiRendererSettings['density']) {
    this.setValue('density', value);
  }
  set primaryColor(value: string) {
    this.setValue('primaryColor', value);
  }
  set borderRadius(value: JsonInput) {
    this.setValue('borderRadius', value);
  }
  set fontFamily(value: string) {
    this.setValue('fontFamily', value);
  }
  set disableAnimations(value: JsonInput) {
    this.setValue('disableAnimations', value);
  }

  private setValue(name: string, value: JsonInput) {
    const key = name.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    this.state = {
      ...this.state,
      [key]: value,
    };
    this.render();
  }

  private dispatch(name: string, detail: unknown) {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  private getMuiSettings(): MuiRendererSettings {
    const settings = (parseJson(this.state.rendererSettings) ??
      {}) as MuiRendererSettings;

    return {
      ...settings,
      inputVariant: this.state.inputVariant ?? settings.inputVariant,
      density: this.state.density ?? settings.density,
      primaryColor: this.state.primaryColor ?? settings.primaryColor,
      borderRadius:
        parseNumber(this.state.borderRadius) ?? settings.borderRadius,
      fontFamily: this.state.fontFamily ?? settings.fontFamily,
      disableAnimations:
        parseBoolean(this.state.disableAnimations) ??
        settings.disableAnimations,
    };
  }

  private render() {
    if (!this.root || !this.cache) return;

    const readonly = parseBoolean(this.state.readonly) ?? false;
    const dark =
      parseBoolean(this.state.dark) ?? parseMode(this.state.mode) === 'dark';
    const rtl = parseBoolean(this.state.rtl) ?? false;
    const config = parseJson(this.state.config) as
      | Record<string, unknown>
      | undefined;
    const translate = this.state.translations
      ? createTranslator(this.state.translations, this.state.locale)
      : undefined;
    const schema = parseJson(this.state.schema);
    const theme = createJsonFormsMuiTheme(this.getMuiSettings(), dark, rtl);

    this.root.render(
      <CacheProvider value={this.cache}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box
            className={
              dark ? 'jsonforms-react-mui dark' : 'jsonforms-react-mui'
            }
            dir={rtl ? 'rtl' : 'ltr'}
          >
            <style>{`
              :host { display: block; color-scheme: light dark; }
              .jsonforms-react-mui { box-sizing: border-box; min-width: 0; background: ${
                theme.palette.background.paper
              }; color: ${theme.palette.text.primary}; }
              .jsonforms-react-mui.dark { color-scheme: dark; }
              ${this.state.customStyle ?? ''}
            `}</style>
            <slot name='styles' />
            <slot name='form-header' />
            <HandleActionContext.Provider
              value={(event) => this.dispatch('handle-action', event)}
            >
              {schema !== undefined && schema !== null ? (
                <JsonForms
                  data={parseJson(this.state.data)}
                  schema={schema}
                  uischema={parseJson(this.state.uischema)}
                  uischemas={parseJson(this.state.uischemas) as any}
                  config={{
                    ...config,
                    readonly,
                  }}
                  readonly={readonly}
                  validationMode={this.state.validationMode}
                  i18n={{
                    locale: this.state.locale,
                    translate,
                  }}
                  additionalErrors={
                    parseJson(this.state.additionalErrors) as any
                  }
                  renderers={muiWebcomponentRenderers}
                  cells={muiWebcomponentCells}
                  onChange={(event) => this.dispatch('change', event)}
                />
              ) : null}
            </HandleActionContext.Provider>
            <slot name='form-footer' />
          </Box>
        </ThemeProvider>
      </CacheProvider>
    );
  }
}

export const registerJsonFormsMui = (
  tagName = JSON_FORMS_MUI_TAG
): CustomElementConstructor => {
  const existing = customElements.get(tagName);
  if (existing) return existing;
  customElements.define(tagName, JsonFormsMuiElement);
  return JsonFormsMuiElement;
};
