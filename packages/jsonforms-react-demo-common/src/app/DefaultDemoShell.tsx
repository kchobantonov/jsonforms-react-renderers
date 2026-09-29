import React from 'react';
import type { DemoShellProps } from './types';

/**
 * The frame: header, example list, settings drawer, content.
 *
 * Replaceable by a renderer family that wants its own chrome, which is why it
 * takes everything as props and holds no state of its own.
 */
export const DefaultDemoShell = ({
  brand,
  rendererName,
  logoSrc,
  dark,
  rtl,
  formOnly,
  sidebarOpen,
  settingsOpen,
  useWebComponent,
  webComponentAvailable,
  search,
  examples,
  currentExampleName,
  settings,
  onHome,
  onSelectExample,
  onSearch,
  onToggleSidebar,
  onToggleFormOnly,
  onToggleWebComponent,
  onOpenSettings,
  onCloseSettings,
  children,
}: DemoShellProps): React.JSX.Element => (
  <div
    className={dark ? 'app-shell app-dark' : 'app-shell'}
    dir={rtl ? 'rtl' : 'ltr'}
  >
    <header className='topbar'>
      <button
        className='demo-button icon-button'
        type='button'
        aria-label='Toggle navigation'
        onClick={onToggleSidebar}
      >
        Menu
      </button>
      <button className='brand' type='button' onClick={onHome}>
        {logoSrc ? (
          <img className='brand-logo' src={logoSrc} alt={`${brand} logo`} />
        ) : (
          <span className='brand-mark'>{brand[0]}</span>
        )}
        <span>
          <strong>JSON Forms</strong>
          <small>React · {rendererName}</small>
        </span>
      </button>
      <div className='topbar-actions'>
        <button
          className='demo-button'
          type='button'
          onClick={onToggleFormOnly}
        >
          {formOnly ? 'Full App' : 'Form Only'}
        </button>
        {webComponentAvailable && (
          <button
            className={`demo-button${useWebComponent ? ' active' : ''}`}
            type='button'
            aria-pressed={useWebComponent}
            onClick={onToggleWebComponent}
          >
            Web Component
          </button>
        )}
        <button className='demo-button' type='button' onClick={onOpenSettings}>
          Settings
        </button>
      </div>
    </header>

    {!formOnly && sidebarOpen && (
      <aside className='sidebar'>
        <input
          value={search}
          placeholder='Search examples'
          onChange={(event) => onSearch(event.target.value)}
        />
        <nav>
          {examples.map((example) => (
            <button
              type='button'
              key={example.name}
              className={`demo-button${
                example.name === currentExampleName ? ' active' : ''
              }`}
              onClick={() => onSelectExample(example.name)}
            >
              {example.label}
            </button>
          ))}
        </nav>
      </aside>
    )}

    <main
      className={`demo-main${!sidebarOpen || formOnly ? ' no-sidebar' : ''}`}
    >
      {children}
    </main>

    {settingsOpen && (
      <div className='settings-backdrop' onClick={onCloseSettings}>
        <aside
          className='settings-panel'
          onClick={(event) => event.stopPropagation()}
        >
          <div className='settings-heading'>
            <h2>Settings</h2>
            <button
              className='demo-button'
              type='button'
              onClick={onCloseSettings}
            >
              Close
            </button>
          </div>
          {settings}
        </aside>
      </div>
    )}
  </div>
);
