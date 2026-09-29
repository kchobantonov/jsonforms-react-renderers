import { isDescriptionHidden } from '@jsonforms/core';

/** UI-independent helper-message policy shared by control wrappers. */
export interface ControlHelpProps {
  description?: string;
  errors?: string;
  visible?: boolean;
  config?: { showUnfocusedDescription?: boolean };
  uischema?: { options?: { showUnfocusedDescription?: boolean } };
}

export const getControlHelp = (
  { description, errors, visible = true, config, uischema }: ControlHelpProps,
  focused: boolean
): string | undefined => {
  if (!visible) return undefined;
  if (errors) return errors;
  return isDescriptionHidden(
    visible,
    description,
    focused,
    uischema?.options?.showUnfocusedDescription ?? config?.showUnfocusedDescription ?? false
  ) ? undefined : description;
};

