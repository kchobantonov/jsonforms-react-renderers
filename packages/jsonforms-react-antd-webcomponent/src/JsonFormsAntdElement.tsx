import { defaultTranslator } from '@jsonforms/core';
import {
  FormElement,
  formAttributes,
  type FormElementState,
} from '@chobantonov/jsonforms-react-renderer-common/webcomponent/element';
import {
  ExtendedJsonForms,
  createAdditionalErrorStore,
  createFormsAjv,
  createAjvErrorTranslator,
  type AjvLocalizers,
} from '@chobantonov/jsonforms-react-antd-extended-renderers';
import { antdWebcomponentCells, antdWebcomponentRenderers } from './renderers';
import { ConfigProvider, Form, InputProps, theme as antdTheme } from 'antd';
import { useAntdLocale } from '@chobantonov/jsonforms-react-antd-renderers';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { StyleProvider } from '@ant-design/cssinjs';
import {
  createTranslator,
  parseBoolean,
  parseJson,
  parseMode,
  type JsonInput,
} from '@chobantonov/jsonforms-react-renderer-common/webcomponent/input';

export { createTranslator, parseBoolean, parseJson, parseMode };
export type { JsonInput };

export const JSON_FORMS_ANTD_TAG = 'jsonforms-react-antd';

/**
 * `ConfigProvider`, told which language it is in.
 *
 * antd owns a second set of strings the form never authors - month names,
 * "Today", "OK", a select's empty text - and they stay English unless its
 * locale is set. The locale is fetched as its own chunk on first use, so a
 * build carries every supported language without shipping them all.
 *
 * `locale` being undefined is antd's own default, which is English. That is
 * what a tag this build does not carry falls back to, and a form in English
 * chrome is a better outcome than one that will not render.
 */
const LocalizedConfigProvider = ({
  localeTag,
  children,
  ...rest
}: Omit<React.ComponentProps<typeof ConfigProvider>, 'locale'> & {
  localeTag?: string;
}) => (
  <ConfigProvider {...rest} locale={useAntdLocale(localeTag)}>
    {children}
  </ConfigProvider>
);

/**
 * Ajv's **own** message localizers, off by default.
 *
 * `ajv-i18n` ships around twenty languages, and importing them is a fixed cost
 * a distributed web component should not pay for a form that never changes
 * locale. Schema-authored `errorMessage` text is translated regardless,
 * through the element's own `translations` - that needs no locale data.
 *
 * A host that wants "must be >= 5" in its language opts in at startup, before
 * any element is upgraded:
 *
 * ```ts
 * import { setAjvLocalizers } from '@chobantonov/jsonforms-react-antd-webcomponent';
 * import { ajvLocalizers } from '@chobantonov/jsonforms-react-extended-renderers/ajv-localizers';
 *
 * setAjvLocalizers(ajvLocalizers);
 * ```
 *
 * or carries only what it ships, which is the point of the option:
 *
 * ```ts
 * setAjvLocalizers({ bg: localizeBg });
 * ```
 *
 * Read through a getter by the validator, so setting it after an element has
 * been created still takes effect on the next validation.
 */
let ajvLocalizers: AjvLocalizers | undefined;

export const setAjvLocalizers = (localizers: AjvLocalizers | undefined) => {
  ajvLocalizers = localizers;
};

export class JsonFormsAntdElement extends FormElement {
  static get observedAttributes() {
    return formAttributes;
  }

  private root?: Root;
  /*
    Per element, not per render: Ajv caches compiled schemas, and a fresh
    instance each paint would recompile the whole schema on every keystroke.
  */
  private ajv = createFormsAjv({
    /*
      A getter, read at validation time: one element outlives many locales,
      and the validator is created once per element (below), so capturing the
      state here would freeze whichever locale happened to be set first.

      This localizes **schema-authored** `errorMessage` text, which costs
      nothing to carry. Ajv's *own* messages ("must be >= 5") stay English
      unless the host also supplies `localizers` - that import pulls every
      language `ajv-i18n` ships, which a distributed bundle should opt into
      rather than inherit. See `setAjvLocalizers` below.
    */
    i18n: () => ({
      locale: this.state.locale,
      translate: this.state.translations
        ? createTranslator(this.state.translations, this.state.locale)
        : defaultTranslator,
    }),
    /*
      Deliberately absent from here in the common case: Ajv's own messages are
      localized at render time instead (see `translateError` below), because
      core does not revalidate on a locale change and a message produced
      during validation would stay in the previous language.
    */
  });
  /*
    Per element, like the validator: a store is the identity errors are
    published against, and it outlives every render of this element.
  */
  private errorStore = createAdditionalErrorStore();
  private colorScheme?: MediaQueryList;
  private renderQueued = false;
  private connectionVersion = 0;
  protected state: FormElementState = {
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
    this.connectionVersion += 1;
    this.root ??= createRoot(this.shadowRoot);
    this.colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
    this.colorScheme.addEventListener('change', this.handleColorSchemeChange);
    this.scheduleRender();
  }

  disconnectedCallback() {
    const connectionVersion = ++this.connectionVersion;
    const root = this.root;
    this.colorScheme?.removeEventListener(
      'change',
      this.handleColorSchemeChange,
    );
    this.colorScheme = undefined;

    queueMicrotask(() => {
      if (
        this.isConnected ||
        connectionVersion !== this.connectionVersion ||
        root !== this.root
      ) {
        return;
      }
      root?.unmount();
      if (root === this.root) this.root = undefined;
    });
  }

  private handleColorSchemeChange = () => this.scheduleRender();

  protected setValue(name: string, value: JsonInput) {
    const key = name.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    this.state = {
      ...this.state,
      [key]: value,
    };
    this.scheduleRender();
  }

  private scheduleRender() {
    if (this.renderQueued) return;
    this.renderQueued = true;
    queueMicrotask(() => {
      this.renderQueued = false;
      if (this.isConnected) this.render();
    });
  }

  private dispatch(name: string, detail: unknown) {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private render() {
    if (!this.root) return;

    const input = this.readFormInput();
    if (!input) return;
    const { schema, data } = input;

    const readonly = parseBoolean(this.state.readonly) ?? false;
    const selectedMode = parseMode(this.state.mode);
    const dark =
      parseBoolean(this.state.dark) ??
      (selectedMode === 'dark' ||
        (selectedMode === 'system' && Boolean(this.colorScheme?.matches)));
    const rtl = parseBoolean(this.state.rtl) ?? false;
    const config = parseJson(this.state.config) as
      | Record<string, unknown>
      | undefined;
    const translate = this.state.translations
      ? createTranslator(this.state.translations, this.state.locale)
      : undefined;
    /*
      Only when the host has opted into locale data; without it core's default
      translator applies, which leaves Ajv's English wording alone.
    */
    const translateError = ajvLocalizers
      ? createAjvErrorTranslator(ajvLocalizers, () => this.state.locale)
      : undefined;
    const rendererSettings =
      (parseJson(this.state.rendererSettings) as Record<string, unknown>) ?? {};

    this.root.render(
      <StyleProvider container={this.shadowRoot ?? undefined}>
        <LocalizedConfigProvider
          localeTag={this.state.locale}
          direction={rtl ? 'rtl' : 'ltr'}
          getPopupContainer={() =>
            (this.shadowRoot?.querySelector(
              '.jsonforms-react-antd',
            ) as HTMLElement | null) ?? this
          }
          theme={{
            algorithm: dark
              ? antdTheme.darkAlgorithm
              : antdTheme.defaultAlgorithm,
          }}
        >
          <div
            className={
              dark ? 'jsonforms-react-antd dark' : 'jsonforms-react-antd'
            }
            dir={rtl ? 'rtl' : 'ltr'}
          >
            <style>{`
            :host { display: block; color-scheme: ${dark ? 'dark' : 'light'}; }
            .jsonforms-react-antd { box-sizing: border-box; min-width: 0; color-scheme: light; background: #fff; color: rgba(0, 0, 0, 0.88); }
            .jsonforms-react-antd.dark { color-scheme: dark; background: #141414; color: rgba(255, 255, 255, 0.88); }
            ${this.state.customStyle ?? ''}
          `}</style>
            <slot name='styles' />
            <slot name='form-header' />
            <Form
              layout='vertical'
              variant={
                (rendererSettings.inputVariant ??
                  'outlined') as InputProps['variant']
              }
            >
              {/*
                `ExtendedJsonForms` rather than `JsonForms`: it installs the
                additional-error store - the middleware and the prop, which
                only work together - and provides the action handler. Without
                it the Monaco control's `propagateErrors` would publish into
                nothing, and an element's own `additionalErrors` attribute is
                merged rather than replaced.
              */}
              <ExtendedJsonForms
                external={
                  parseJson(this.state.external) as
                    | Readonly<Record<string, unknown>>
                    | undefined
                }
                store={this.errorStore}
                onAction={(event) => this.dispatch('handle-action', event)}
                data={data}
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
                  ...(translateError ? { translateError } : {}),
                }}
                additionalErrors={parseJson(this.state.additionalErrors) as any}
                ajv={this.ajv}
                renderers={antdWebcomponentRenderers}
                cells={antdWebcomponentCells}
                onChange={(event) => this.dispatch('change', event)}
              />
            </Form>
            <slot name='form-footer' />
          </div>
        </LocalizedConfigProvider>
      </StyleProvider>,
    );
  }
}

export const registerJsonFormsAntd = (
  tagName = JSON_FORMS_ANTD_TAG,
): CustomElementConstructor => {
  const existing = customElements.get(tagName);
  if (existing) return existing;
  customElements.define(tagName, JsonFormsAntdElement);
  return JsonFormsAntdElement;
};
