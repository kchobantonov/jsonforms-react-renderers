import React from 'react';
import Editor from '@monaco-editor/react';
import { RotateCcw, Save } from 'lucide-react';
import type { JsonFormsInitStateProps } from '@jsonforms/react';
import type { ExampleDescription } from '@jsonforms/examples';
import type { DemoLayout, DemoTab } from '../demoPreferences';
import { EditorModels, reloadOriginalEditorModel } from '../editorModels';
import type { TranslationCatalogs } from '../i18nCatalogs';
import type { DemoUi } from './types';
import { DefaultDemoSplitter } from '../DemoSplitter';
import { DefaultDemoTypography } from '../DefaultDemoTypography';
import { DemoValidationIndicator } from './DemoValidationIndicator';
import { DemoEditorPanel } from './DemoEditorPanel';
import { DATA_MODEL_PATH, parseEditorValue } from './editorValue';

/**
 * One example, open: its tabs, its form, and its editors.
 *
 * The arrangement is the demo's whole argument - the form on the left and the
 * schema that produced it on the right - so this is where the tab strip, the
 * split and the two panes live. What goes *inside* the panes is
 * `DemoFormPanel` and `DemoEditorPanel`; this only decides which is on screen.
 */
export interface DemoWorkspaceProps {
  Ui: DemoUi;
  currentExample: ExampleDescription;
  /** An example's own buttons, which rewrite its props. */
  actions: { label: string; apply: (props: any) => any }[];
  setExampleProps: React.Dispatch<
    React.SetStateAction<JsonFormsInitStateProps>
  >;
  activeTab: DemoTab;
  changeActiveTab: (tab: DemoTab) => void;
  layout: DemoLayout;
  formOnly: boolean;
  errors: unknown[];
  models: EditorModels;
  setModels: React.Dispatch<React.SetStateAction<EditorModels>>;
  setTranslations: React.Dispatch<
    React.SetStateAction<TranslationCatalogs | undefined>
  >;
  dark: boolean;
  /** Applying the Data editor's text, in the demo-and-data layout. */
  setData: (data: unknown) => void;
  /** The form, rendered by the caller so the workspace stays presentational. */
  renderForm: () => React.ReactNode;
}

export const DemoWorkspace = ({
  Ui,
  currentExample,
  actions,
  setExampleProps,
  activeTab,
  changeActiveTab,
  layout,
  formOnly,
  errors,
  models,
  setModels,
  setTranslations,
  dark,
  setData,
  renderForm,
}: DemoWorkspaceProps) => {
  const {
    Button: UiButton,
    Panel: UiPanel,
    Splitter: UiSplitter = DefaultDemoSplitter,
    Tabs: UiTabs,
    Typography: UiTypography = DefaultDemoTypography,
  } = Ui;

  return (
    <section className={formOnly ? 'workspace form-only' : 'workspace'}>
      {!formOnly && (
        <div className='workspace-title'>
          <UiTypography component='h1'>{currentExample.label}</UiTypography>
        </div>
      )}

      {formOnly ? (
        <UiPanel className='form-card standalone'>{renderForm()}</UiPanel>
      ) : (
        <div className='demo-tabs'>
          <UiTabs
            value={activeTab}
            items={(
              [
                'demo',
                'schema',
                'uischema',
                'uischemas',
                'i18n',
                'config',
                'data',
              ] as const
            )
              .filter((tab) => layout !== 'demo-and-data' || tab !== 'data')
              .map((tab) => ({
                value: tab,
                label:
                  tab === 'demo' ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      {layout === 'demo-and-data' ? 'Demo and Data' : 'Demo'}
                      <DemoValidationIndicator
                        errors={errors}
                        Tooltip={Ui.Tooltip}
                      />
                    </span>
                  ) : tab === 'uischema' ? (
                    'UI Schema'
                  ) : tab === 'uischemas' ? (
                    'UI Schemas'
                  ) : tab === 'i18n' ? (
                    'Internationalization'
                  ) : (
                    tab[0].toUpperCase() + tab.slice(1)
                  ),
              }))}
            onChange={(value) => changeActiveTab(value as DemoTab)}
          />

          {activeTab === 'demo' ? (
            <UiPanel className='panel'>
              <div className='jsonform-toolbar'>
                <UiTypography component='h2'>JSON Forms</UiTypography>
                <div className='action-row'>
                  {actions.map((action) => (
                    <UiButton
                      key={action.label}
                      onClick={() =>
                        setExampleProps((oldProps: JsonFormsInitStateProps) =>
                          action.apply(oldProps)
                        )
                      }
                    >
                      {action.label}
                    </UiButton>
                  ))}
                </div>
              </div>
              {layout === 'demo-and-data' ? (
                <UiSplitter
                  form={
                    <section className='demo-data-pane demo-form-pane'>
                      <UiTypography component='h3'>Demo</UiTypography>
                      <UiPanel className='form-card'>{renderForm()}</UiPanel>
                    </section>
                  }
                  data={
                    <section className='demo-data-pane demo-editor-pane'>
                      <div className='editor-heading'>
                        <UiTypography component='h3'>Data</UiTypography>
                        <div className='action-row'>
                          <UiButton
                            ariaLabel='Reload original example data'
                            iconOnly
                            tooltip='Reload original example data'
                            onClick={() =>
                              setModels((current) =>
                                reloadOriginalEditorModel(
                                  current,
                                  'data',
                                  currentExample.data
                                )
                              )
                            }
                          >
                            <RotateCcw aria-hidden='true' />
                            <span className='sr-only'>
                              Reload original example data
                            </span>
                          </UiButton>
                          <UiButton
                            ariaLabel='Apply data changes'
                            iconOnly
                            tooltip='Apply data changes'
                            onClick={() =>
                              setData(parseEditorValue(models.data))
                            }
                          >
                            <Save aria-hidden='true' />
                            <span className='sr-only'>Apply data changes</span>
                          </UiButton>
                        </div>
                      </div>
                      <div className='data-editor-frame'>
                        <Editor
                          height='calc(100vh - 19rem)'
                          path={DATA_MODEL_PATH}
                          defaultLanguage='json'
                          theme={dark ? 'vs-dark' : 'light'}
                          value={models.data}
                          onChange={(value) =>
                            setModels((current) => ({
                              ...current,
                              data: value ?? '',
                            }))
                          }
                        />
                      </div>
                    </section>
                  }
                />
              ) : (
                <UiPanel className='form-card'>{renderForm()}</UiPanel>
              )}
            </UiPanel>
          ) : (
            <DemoEditorPanel
              Ui={Ui}
              activeTab={activeTab as Exclude<DemoTab, 'demo'>}
              models={models}
              setModels={setModels}
              currentExample={currentExample}
              dark={dark}
              setExampleProps={setExampleProps}
              setTranslations={setTranslations}
            />
          )}
        </div>
      )}
    </section>
  );
};
