import { ControlProps, JsonSchema, UISchemaElement } from '@jsonforms/core';
import React from 'react';
export type EditorControlFrameProps = React.PropsWithChildren<ControlProps>;
export type EditorActionProps = React.PropsWithChildren<{
  disabled?: boolean;
  onClick?: React.MouseEventHandler<any>;
  title?: string;
  'aria-label'?: string;
  /** Renderer sets map this onto their own button emphasis. */
  variant?: 'default' | 'primary' | 'danger';
  icon?: React.ReactNode;
}>;
/**
 * Chrome drawn around the editor. A renderer set supplies one so the control
 * matches its own text-input styling (border, radius, hover/focus/error states).
 */
export type EditorSurfaceProps = React.PropsWithChildren<{
  hovered?: boolean;
  focused?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  maximized?: boolean;
}>;
/**
 * Palette read from the host design system. Every field is optional: renderers
 * fall back to neutral light-dark() defaults when a value is missing.
 */
export type EditorTheme = {
  isDark?: boolean;
  /** Background of the surface, so the editor canvas can match it exactly. */
  background?: string;
  foreground?: string;
  border?: string;
  accent?: string;
  headerBackground?: string;
  headerForeground?: string;
  rowHover?: string;
  selectedRowBackground?: string;
  fontFamily?: string;
};
/** One toolbar action, rendered by the renderer set in its own house style. */
export type EditorArrayAction = {
  key: string;
  /** Tooltip and accessible name. */
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
};
/**
 * Chrome around an array control: title, validation indicator and toolbar
 * actions. Supplying one lets the grid share the header of the renderer set's
 * other array renderers instead of inventing its own.
 */
export type EditorArrayFrameProps = React.PropsWithChildren<{
  options?: Record<string, any>;
  config?: any;
  label?: string;
  description?: string;
  errors?: string;
  actions?: EditorArrayAction[];
}>;
export type EditorRendererComponents = {
  Frame: React.ComponentType<EditorControlFrameProps>;
  Button: React.ComponentType<EditorActionProps>;
  /**
   * Optional icons for the editor's maximize/restore toggle. When omitted the
   * toggle falls back to a text label, so existing renderer sets keep working.
   */
  MaximizeIcon?: React.ComponentType;
  MinimizeIcon?: React.ComponentType;
  /** Icons for the array toolbar; omitted icons fall back to text labels. */
  AddIcon?: React.ComponentType;
  RemoveIcon?: React.ComponentType;
  /** Optional chrome around the editor; defaults to an unstyled container. */
  Surface?: React.ComponentType<EditorSurfaceProps>;
  /** Optional chrome around array controls (title + validation + actions). */
  ArrayFrame?: React.ComponentType<EditorArrayFrameProps>;
  /**
   * Wraps each grid cell. Renderer sets use it to put their controls into
   * "cell mode" - same renderers, without the label and inline message.
   */
  CellFrame?: React.ComponentType<
    React.PropsWithChildren<{
      schema?: JsonSchema;
      uischema?: UISchemaElement;
      path: string;
    }>
  >;
  /**
   * Placeholder while the renderer's heavy dependency (Monaco, AG Grid) is
   * still being fetched. Renderer sets supply their own skeleton/spinner.
   */
  Loading?: React.ComponentType<{ label?: string }>;
  /** Shown when that dependency fails to load. */
  LoadError?: React.ComponentType<{ label?: string }>;
  /**
   * Routes a destructive array action through the host's confirmation policy.
   *
   * Deliberately **policy-free**: this package is framework-agnostic and must
   * not know the catalog ids, the `always`/`never`/`complex` vocabulary or the
   * dialog. It says what would be discarded and what to do if the host agrees;
   * the renderer set that registers this renderer supplies the rest, because
   * that is where the renderer's catalog identity actually lives.
   *
   * Omitted, the action runs immediately - which is what every renderer set
   * did before, so nothing changes for one that has not opted in.
   */
  useRemoveConfirmation?: () => {
    request: (input: {
      discarded: unknown[];
      options?: Record<string, unknown>;
      config?: unknown;
      perform: () => void;
    }) => void;
    dialog?: React.ReactNode;
  };
  /**
   * Optional hook returning the host design system's active theme (e.g. antd's
   * theme algorithm). Supplying it makes the editors follow the design system
   * instead of guessing from DOM background luminance.
   */
  useEditorTheme?: () => EditorTheme | undefined;
};
