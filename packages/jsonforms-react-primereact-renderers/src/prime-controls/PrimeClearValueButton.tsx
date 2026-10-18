import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/translate';
import { PrimeIconButton } from './PrimeIconButton';
import React, { createContext, useContext, useState } from 'react';

const ClearVisibility = createContext(false);

export const PrimeClearableInput = ({ children }: React.PropsWithChildren) => {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <ClearVisibility.Provider value={hovered || focused}>
      <span
        style={{ display: 'block', position: 'relative', minWidth: 0 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setFocused(false);
        }}
      >
        {children}
      </span>
    </ClearVisibility.Provider>
  );
};

export interface PrimeClearValueButtonProps {
  clearable?: boolean;
  data: unknown;
  enabled: boolean;
  onClear: () => void;
}

export const PrimeClearValueButton = ({
  clearable = true,
  data,
  enabled,
  onClear,
}: PrimeClearValueButtonProps) => {
  const t = useI18n();
  const visible = useContext(ClearVisibility);
  const populated = data !== undefined && data !== null && data !== '';
  if (!clearable || !enabled || !populated) return null;

  return (
    <PrimeIconButton
      aria-label={t('control.clearValue')}
      icon='pi pi-times'
      onClick={(event) => {
        event.stopPropagation();
        onClear();
      }}
      onMouseDown={(event) => event.preventDefault()}
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        width: '2rem',
        height: '2rem',
        padding: 0,
        insetBlockStart: '50%',
        insetInlineEnd: '0.25rem',
        position: 'absolute',
        transform: 'translateY(-50%)',
      }}
      tooltip={t('control.clearValue')}
    />
  );
};
