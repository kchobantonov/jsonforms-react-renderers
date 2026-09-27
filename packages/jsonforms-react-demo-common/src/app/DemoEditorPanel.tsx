import React from 'react';
import Editor from '@monaco-editor/react';
import { RotateCcw, Save } from 'lucide-react';
import type { JsonFormsInitStateProps } from '@jsonforms/react';
import type { ExampleDescription } from '@jsonforms/examples';
import { EditorModels, reloadOriginalEditorModel } from '../editorModels';
import { TranslationCatalogs, asTranslationCatalogs } from '../i18nCatalogs';
import type { DemoTab } from '../demoPreferences';
import type { DemoUi } from './types';
import { DefaultDemoTypography } from '../DefaultDemoTypography';
import { parseEditorValue } from './editorValue';

/**
 * One Monaco editor, for whichever model the open tab names.
 *
 * Schema, UI schema, UI schemas, internationalization and config all edit the
 * same way - reload the example's original, or apply what is in the editor -
 * so they are one component with the tab as a parameter rather than five
 * near-identical blocks of JSX.
 *
 * Applying is explicit on purpose: these edit the form's *definition*, and
 * re-parsing on every keystroke would hand JSON Forms half-typed schemas.
 */
export interface DemoEditorPanelProps {
  Ui: DemoUi;
  activeTab: Exclude<DemoTab, 'demo'>;
  models: EditorModels;
  setModels: React.Dispatch<React.SetStateAction<EditorModels>>;
  currentExample: ExampleDescription;
  dark: boolean;
  setExampleProps: React.Dispatch<
    React.SetStateAction<JsonFormsInitStateProps>
  >;
  setTranslations: React.Dispatch<
    React.SetStateAction<TranslationCatalogs | undefined>
  >;
}

export const DemoEditorPanel = ({
  Ui,
  activeTab,
  models,
  setModels,
  currentExample,
  dark,
  setExampleProps,
  setTranslations,
}: DemoEditorPanelProps) => {
  const {
    Button: UiButton,
    Panel: UiPanel,
    Typography: UiTypography = DefaultDemoTypography,
  } = Ui;

  return (
    <UiPanel className='editor-panel panel'>
      <div className='editor-heading'>
        <UiTypography component='h2'>{activeTab}</UiTypography>
        <div className='action-row'>
          <UiButton
            ariaLabel='Reload original example value'
            iconOnly
            tooltip='Reload original example value'
            onClick={() =>
              setModels((oldModels) =>
                reloadOriginalEditorModel(
                  oldModels,
                  activeTab,
                  currentExample[activeTab]
                )
              )
            }
          >
            <RotateCcw aria-hidden='true' />
            <span className='sr-only'>Reload original example value</span>
          </UiButton>
          <UiButton
            ariaLabel='Apply editor changes'
            iconOnly
            tooltip='Apply editor changes'
            onClick={() => {
              const parsed = parseEditorValue(models[activeTab]);
              if (activeTab !== 'i18n') {
                setExampleProps((oldProps) => ({
                  ...oldProps,
                  [activeTab]: parsed,
                }));
                return;
              }
              // The Internationalization editor holds the raw
              // catalogs. `translate` is a function, so it is never in
              // the document; writing the parsed object straight
              // through would leave the form with no translator at
              // all. Keep the catalogs instead - the props memo builds
              // `translate` from them for the active locale.
              const catalogs = asTranslationCatalogs(parsed);
              setTranslations(catalogs);
              if (!catalogs) {
                setExampleProps((oldProps) => ({
                  ...oldProps,
                  i18n: parsed,
                }));
              }
            }}
          >
            <Save aria-hidden='true' />
            <span className='sr-only'>Apply editor changes</span>
          </UiButton>
        </div>
      </div>
      <Editor
        height='68vh'
        defaultLanguage='json'
        theme={dark ? 'vs-dark' : 'light'}
        value={models[activeTab]}
        onChange={(value) =>
          setModels((oldModels) => ({
            ...oldModels,
            [activeTab]: value ?? '',
          }))
        }
      />
    </UiPanel>
  );
};
