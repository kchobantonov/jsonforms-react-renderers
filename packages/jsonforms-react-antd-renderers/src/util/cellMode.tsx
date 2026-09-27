import React, { createContext, useContext } from 'react';
import { Form, Tooltip } from 'antd';
import ExclamationCircleFilled from '@ant-design/icons/ExclamationCircleFilled';

const CellModeContext = createContext(false);

/**
 * Marks a subtree as rendering inside a table cell. Controls keep their normal
 * implementation - there is deliberately no separate "cell" copy of each
 * renderer - but drop the chrome a cell has no room for.
 *
 * Pass `value={false}` to leave cell mode again. A detail dialog opened from a
 * cell needs this: it portals elsewhere in the DOM, but React context follows
 * the component tree, so without it the dialog's fields render label-less too.
 */
export const CellModeProvider = ({
  value = true,
  children,
}: React.PropsWithChildren<{ value?: boolean }>) => (
  <CellModeContext.Provider value={value}>{children}</CellModeContext.Provider>
);

export const useCellMode = (): boolean => useContext(CellModeContext);

export interface ControlFormItemProps {
  id?: string;
  htmlFor?: string;
  label?: React.ReactNode;
  required?: boolean;
  /** Validation messages; drives the error state and, in cells, the tooltip. */
  errors?: string;
  /** Message shown under the control outside cells (errors or description). */
  help?: React.ReactNode;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * The single Form.Item every antd control renders through.
 *
 * Outside a table it behaves as before: label above, message below. Inside a
 * cell the column header already supplies the label and a message underneath
 * would break the row height, so both are dropped and the validation message
 * moves into a tooltip on the control's error state instead.
 */
export const ControlFormItem = ({
  id,
  htmlFor,
  label,
  required,
  errors,
  help,
  style,
  children,
}: ControlFormItemProps) => {
  const cell = useCellMode();
  const isValid = !errors || errors.length === 0;

  /**
   * antd's hasFeedback accepts custom icons, so the validation message can hang
   * off the error icon itself rather than the whole field. One message per line
   * keeps multi-error tooltips readable.
   *
   * **`hasFeedback` stays on whether or not the field is valid, and the icon is
   * suppressed instead.** It is not a style choice; switching it changes the
   * DOM. antd composes the feedback icon into the input's `suffix`, and an antd
   * `Input` with no prefix, suffix or `allowClear` renders a bare `<input>`
   * while one with any of them nests it inside
   * `<span class="ant-input-affix-wrapper">`. Turning feedback on at the moment
   * a field becomes invalid therefore moves the input to a new position in the
   * element tree, so React unmounts it and mounts a fresh one - and whoever was
   * typing loses the caret mid-word. antd warns about exactly this in
   * development: "dynamic add or remove prefix / suffix will make it lose focus
   * caused by dom structure change".
   *
   * Returning `false` for a status is antd's own way to say it draws no icon,
   * while the slot - and so the element tree - stays put. The only trace on a
   * valid field is an empty suffix span holding four pixels open, which is a
   * gutter the error icon then no longer has to push the text aside to claim.
   *
   * Any control that always has a prefix or suffix of its own - the color
   * picker's swatch, the password field's reveal button - was already immune,
   * which is why this only ever showed up on the plain text and masked fields.
   */
  const feedbackIcons = () => ({
    success: false,
    warning: false,
    validating: false,
    error: (
      <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{errors}</span>}>
        <ExclamationCircleFilled
          // In a cell the message exists only inside the tooltip, which opens
          // on hover and so is not reachable by a screen reader. Naming the
          // icon with the message keeps it announced.
          role='img'
          aria-label={errors}
          // antd sets pointer-events: none on .ant-form-item-feedback-icon so
          // the icon never blocks the input. That also means it never receives
          // hover, so the tooltip would never open - a descendant may opt back
          // in without making the whole slot clickable.
          style={{ pointerEvents: 'auto', cursor: 'help' }}
        />
      </Tooltip>
    ),
  });

  if (cell) {
    return (
      <Form.Item
        required={required}
        hasFeedback={{ icons: feedbackIcons }}
        validateStatus={isValid ? 'success' : 'error'}
        style={{ marginBottom: 0, ...style }}
        htmlFor={htmlFor}
        id={id}
      >
        {children}
      </Form.Item>
    );
  }

  return (
    <Form.Item
      required={required}
      hasFeedback={{ icons: feedbackIcons }}
      validateStatus={isValid ? 'success' : 'error'}
      label={label}
      help={help ?? null}
      style={style}
      htmlFor={htmlFor}
      id={id}
    >
      {children}
    </Form.Item>
  );
};
