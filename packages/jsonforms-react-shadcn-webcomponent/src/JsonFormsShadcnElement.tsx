import { defaultTranslator } from '@jsonforms/core';
import {
  FormElement,
  formAttributes,
  type FormElementState,
} from '@chobantonov/jsonforms-react-renderer-common/webcomponent/element';
import {
  ShadcnRendererSettings,
  createShadcnRendererStyle,
} from '@chobantonov/jsonforms-react-shadcn-extended-renderers';
import {
  ActionEvent,
  ExtendedJsonForms,
  createAdditionalErrorStore,
  createFormsAjv,
} from '@chobantonov/jsonforms-react-extended-renderers';
import { createRoot, Root } from 'react-dom/client';
import {
  shadcnWebcomponentCells,
  shadcnWebcomponentRenderers,
} from './renderers';
import rendererStyles from '../../jsonforms-react-shadcn-renderers/src/styles.css?inline';
import webcomponentStyles from './styles.css?inline';
import {
  createTranslator,
  parseBoolean,
  parseJson,
  parseMode,
  type JsonInput,
} from '@chobantonov/jsonforms-react-renderer-common/webcomponent/input';

export { createTranslator, parseBoolean, parseJson, parseMode };
export type { JsonInput };

export const JSON_FORMS_SHADCN_TAG = 'jsonforms-react-shadcn';

type ElementState = FormElementState & {
  accentColor?: string;
  borderRadius?: JsonInput;
  density?: ShadcnRendererSettings['density'];
};
const observedAttributes = [
  ...formAttributes,
  'accent-color',
  'border-radius',
  'density',
];

export class JsonFormsShadcnElement extends FormElement {
  static get observedAttributes() {
    return observedAttributes;
  }

  private root?: Root;
  readonly errorStore = createAdditionalErrorStore();
  private ajv = createFormsAjv({
    i18n: () => ({
      locale: this.state.locale,
      translate: this.state.translations
        ? createTranslator(this.state.translations, this.state.locale)
        : defaultTranslator,
    }),
  });
  protected state: ElementState = {
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
    this.root ??= createRoot(this.shadowRoot);
    this.render();
  }

  disconnectedCallback() {
    // The host may be removing this element during its own React commit.
    // Reuse the root if the element is moved/reconnected before cleanup runs.
    queueMicrotask(() => {
      if (this.isConnected) return;
      this.root?.unmount();
      this.root = undefined;
    });
  }

  set accentColor(value: string) {
    this.setValue('accentColor', value);
  }
  set borderRadius(value: JsonInput) {
    this.setValue('borderRadius', value);
  }
  set density(value: ShadcnRendererSettings['density']) {
    this.setValue('density', value);
  }

  protected setValue(name: string, value: JsonInput) {
    const key = name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    (this.state as any)[key] = value;
    this.render();
  }

  private emitChange(data: unknown, errors: unknown[] = []) {
    this.dispatchEvent(
      new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { data, errors },
      }),
    );
  }

  private emitAction(event: ActionEvent) {
    this.dispatchEvent(
      new CustomEvent('handle-action', {
        bubbles: true,
        composed: true,
        detail: event,
      }),
    );
  }

  private render() {
    if (!this.root) return;
    const input = this.readFormInput();
    if (!input) return;
    const { schema, data } = input;

    const dark =
      parseBoolean(this.state.dark) ?? parseMode(this.state.mode) === 'dark';
    const rendererSettings = {
      ...(parseJson(this.state.rendererSettings) as ShadcnRendererSettings),
      accentColor: this.state.accentColor,
      borderRadius:
        typeof this.state.borderRadius === 'string'
          ? Number(this.state.borderRadius)
          : this.state.borderRadius,
      density: this.state.density,
    } as ShadcnRendererSettings;
    const style = createShadcnRendererStyle(rendererSettings, dark);
    const translate = this.state.translations
      ? createTranslator(this.state.translations, this.state.locale)
      : undefined;

    this.root.render(
      <>
        <style>{rendererStyles}</style>
        <style>{webcomponentStyles}</style>
        <style>{this.state.customStyle ?? ''}</style>
        <div
          className={
            dark
              ? 'shadcn-jsonforms-host shadcn-jsonforms-root app-dark dark'
              : 'shadcn-jsonforms-host shadcn-jsonforms-root'
          }
          data-dark={dark ? 'true' : 'false'}
          dir={parseBoolean(this.state.rtl) ? 'rtl' : undefined}
          style={style}
        >
          <slot name='form-header' />
          <ExtendedJsonForms
            external={
              parseJson(this.state.external) as
                | Readonly<Record<string, unknown>>
                | undefined
            }
            ajv={this.ajv}
            store={this.errorStore}
            onAction={(event) => this.emitAction(event)}
            data={data}
            schema={schema as any}
            uischema={parseJson(this.state.uischema) as any}
            uischemas={parseJson(this.state.uischemas) as any}
            config={{
              ...(parseJson(this.state.config) as Record<string, any>),
              readonly: parseBoolean(this.state.readonly),
            }}
            readonly={parseBoolean(this.state.readonly)}
            validationMode={this.state.validationMode}
            renderers={shadcnWebcomponentRenderers}
            cells={shadcnWebcomponentCells}
            additionalErrors={parseJson(this.state.additionalErrors) as any}
            i18n={{
              locale: this.state.locale,
              translate,
            }}
            onChange={({ data, errors }) => this.emitChange(data, errors)}
          />
          <slot name='form-footer' />
        </div>
      </>,
    );
  }
}

export const registerJsonFormsShadcn = (
  tagName: string = JSON_FORMS_SHADCN_TAG,
) => {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, JsonFormsShadcnElement);
  }
};
