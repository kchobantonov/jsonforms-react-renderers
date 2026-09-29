import { useEffect, useId, useState } from 'react';

/** Array panel state is independent of expansion of individual array items. */
export const useArrayPanelState = (
  options: Record<string, any> = {},
  config: any = {}
) => {
  const option = (key: string) =>
    options[key] ?? config?.jsonformsExtended?.[key] ?? config?.[key];
  const collapsible = option('collapsible') === true;
  const initial = option('collapsed') === true;
  const [collapsed, setCollapsed] = useState(initial);
  useEffect(() => setCollapsed(initial), [initial]);
  return {
    collapsible,
    collapsed: collapsible && collapsed,
    contentId: useId(),
    toggle: () => setCollapsed((value) => !value),
  };
};
