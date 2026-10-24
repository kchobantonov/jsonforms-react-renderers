import { resolveCollapsed } from './groupState';
import { useId, useState } from 'react';

/** Array panel state is independent of expansion of individual array items. */
export const useArrayPanelState = (
  options: Record<string, any> = {},
  config: any = {},
) => {
  const option = (key: string) =>
    options[key] ?? config?.jsonformsExtended?.[key] ?? config?.[key];
  const collapsible = option('collapsible') === true;
  const initial = resolveCollapsed(options, config, 'array');
  const [collapsed, setCollapsed] = useState(initial);
  const [previousInitial, setPreviousInitial] = useState(initial);
  if (previousInitial !== initial) {
    setPreviousInitial(initial);
    setCollapsed(initial);
  }
  return {
    collapsible,
    collapsed: collapsible && collapsed,
    contentId: useId(),
    toggle: () => setCollapsed((value) => !value),
  };
};
