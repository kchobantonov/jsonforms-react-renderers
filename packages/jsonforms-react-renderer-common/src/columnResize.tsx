import React, { useRef, useState } from 'react';
import { useI18n } from './translate';
import { TableColumnDefinition } from './tableColumns';

export const useColumnWidths = () => useState<Record<string, number>>({});

/** Pointer and keyboard interaction shared by native table header integrations. */
export const ColumnResizeHandle = ({ field, definition, width, onResize }: {
  field: string;
  definition?: TableColumnDefinition;
  width?: number;
  onResize: (width: number) => void;
}) => {
  const t = useI18n();
  const drag = useRef<{ x: number; width: number; direction: number }>();
  const min = definition?.minWidth ?? 48;
  const max = Math.max(min, definition?.maxWidth ?? 2000);
  const clamp = (value: number) => Math.min(max, Math.max(min, value));
  const measured = (element: HTMLElement) => width ?? definition?.width ?? element.closest('th')?.getBoundingClientRect().width ?? 160;
  return <span
    role='separator' aria-orientation='vertical' tabIndex={0}
    aria-label={t('collection.resizeColumn', { field })}
    aria-valuemin={min} aria-valuemax={max} aria-valuenow={Math.round(clamp(width ?? definition?.width ?? 160))}
    style={{ position: 'absolute', insetInlineEnd: 0, top: 0, bottom: 0, width: 8, cursor: 'col-resize', touchAction: 'none', borderInlineEnd: '1px solid currentColor', opacity: 0.45 }}
    onClick={(event) => event.stopPropagation()}
    onPointerDown={(event) => {
      if (event.button !== 0) return;
      event.preventDefault(); event.stopPropagation();
      event.currentTarget.focus();
      drag.current = { x: event.clientX, width: measured(event.currentTarget), direction: getComputedStyle(event.currentTarget).direction === 'rtl' ? -1 : 1 };
      event.currentTarget.setPointerCapture(event.pointerId);
    }}
    onPointerMove={(event) => {
      if (drag.current) onResize(clamp(drag.current.width + (event.clientX - drag.current.x) * drag.current.direction));
    }}
    onPointerUp={(event) => { drag.current = undefined; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
    onPointerCancel={() => { drag.current = undefined; }}
    onLostPointerCapture={() => { drag.current = undefined; }}
    onKeyDown={(event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); event.stopPropagation();
      const direction = getComputedStyle(event.currentTarget).direction === 'rtl' ? -1 : 1;
      onResize(clamp(event.key === 'Home' ? min : event.key === 'End' ? max : measured(event.currentTarget) + (event.key === 'ArrowRight' ? 10 : -10) * direction));
    }}
  />;
};
