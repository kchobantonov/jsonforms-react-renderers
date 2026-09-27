import React from 'react';
import type { DemoSplitterProps } from '../DemoSplitter';

/**
 * The demo's own component contract.
 *
 * A renderer-set demo supplies these - a button, a select, a shell - and the
 * demo application is written against them rather than against antd, so the
 * same screens can host a different renderer family. None of it is JSON Forms;
 * keeping it out of `App` is what lets `App` be about the form.
 */
export type ProviderSettingsProps = {
  settings: Record<string, any>;
  setSettings: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  dark: boolean;
  mode: string;
  rtl: boolean;
};

export type DemoWrapperProps = React.PropsWithChildren<{
  rendererSettings: Record<string, any>;
  dark: boolean;
  mode: string;
  rtl: boolean;
  /**
   * The form's language tag.
   *
   * This package stays renderer-agnostic, and a UI library's own strings -
   * antd's month names, "Today", a select's empty text - are the renderer
   * set's business. The wrapper is where that gets connected.
   */
  locale: string;
}>;

export type DemoShellProps = React.PropsWithChildren<{
  brand: string;
  rendererName: string;
  logoSrc?: string;
  dark: boolean;
  rtl: boolean;
  isHome: boolean;
  formOnly: boolean;
  sidebarOpen: boolean;
  settingsOpen: boolean;
  useWebComponent: boolean;
  webComponentAvailable: boolean;
  search: string;
  examples: Array<{ name: string; label: string }>;
  currentExampleName?: string;
  settings: React.ReactNode;
  onHome: () => void;
  onSelectExample: (name: string) => void;
  onSearch: (value: string) => void;
  onToggleSidebar: () => void;
  onToggleFormOnly: () => void;
  onToggleWebComponent: () => void;
  onOpenSettings: () => void;
  onCloseSettings: () => void;
}>;

export type DemoShell = React.ComponentType<DemoShellProps>;

export type DemoOption = {
  label: string;
  value: string;
};

export type DemoButtonProps = React.PropsWithChildren<{
  active?: boolean;
  ariaLabel?: string;
  disabled?: boolean;
  iconOnly?: boolean;
  tooltip?: string;
  onClick: () => void;
}>;

export type DemoPanelProps = React.PropsWithChildren<{
  className?: string;
}>;

export type DemoTabsProps = {
  items: DemoOption[];
  value: string;
  onChange: (value: string) => void;
};

export type DemoSelectProps = {
  label: string;
  options: DemoOption[];
  value: string;
  onChange: (value: string) => void;
};

export type DemoToggleProps = {
  checked: boolean;
  label: string;
  description?: string;
  onChange: (checked: boolean) => void;
};

export type DemoTextInputProps = {
  label: string;
  value: string;
  placeholder?: string;
  description?: string;
  onChange: (value: string) => void;
};

export type DemoTypographyProps = React.PropsWithChildren<{
  component: 'h1' | 'h2' | 'h3' | 'p';
  className?: string;
}>;

export type DemoUi = {
  Typography?: React.ComponentType<DemoTypographyProps>;
  TextInput?: React.ComponentType<DemoTextInputProps>;
  SegmentedControl?: React.ComponentType<DemoSelectProps>;
  Divider?: React.ComponentType;

  Button: React.ComponentType<DemoButtonProps>;
  Panel: React.ComponentType<DemoPanelProps>;
  Select: React.ComponentType<DemoSelectProps>;
  Splitter?: React.ComponentType<DemoSplitterProps>;
  Tabs: React.ComponentType<DemoTabsProps>;
  Toggle: React.ComponentType<DemoToggleProps>;
};
