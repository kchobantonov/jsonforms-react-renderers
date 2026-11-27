import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/locale/translate';
import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@jsonforms-react-shadcn-ui/button';
import type { useArrayPanelState } from '@chobantonov/jsonforms-react-renderer-common/collections/useArrayPanelState';

export function ArrayPanelToggle({
  panel,
  label,
}: {
  panel: ReturnType<typeof useArrayPanelState>;
  label?: string;
}) {
  const t = useI18n();
  if (!panel.collapsible) return null;
  return (
    <Button
      type='button'
      variant='ghost'
      size='icon-sm'
      aria-label={label || t('control.array')}
      aria-expanded={!panel.collapsed}
      aria-controls={panel.contentId}
      onClick={panel.toggle}
    >
      {panel.collapsed ? (
        <ChevronDown aria-hidden='true' />
      ) : (
        <ChevronUp aria-hidden='true' />
      )}
    </Button>
  );
}
