import React, { useRef, useState } from 'react';
import { useI18n } from './translate';
import { TableColumnDefinition } from './tableColumns';

export const useColumnWidths = () => useState<Record<string, number>>({});

/** Pointer and keyboard interaction shared by native table header integrations. */
export const ColumnResizeHandle = ({
  field,
  definition,
  width,
  onResize,
  onResizeStart,
  colors,
}: {
  colors: { border: string; active: string; focus: string };
  field: string;
  definition?: TableColumnDefinition;
  width?: number;
  onResize: (width: number) => void;
  onResizeStart?: (widths: Record<string, number>) => void;
}) => {
  const t = useI18n();
  const [hovered, setHovered] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [focused, setFocused] = useState(false);
  const drag = useRef<{ x: number; width: number; direction: number }>();
  const min = definition?.minWidth ?? 48;
  const max = Math.max(min, definition?.maxWidth ?? 2000);
  const clamp = (value: number) => Math.min(max, Math.max(min, value));
  const measured = (element: HTMLElement) =>
    element.closest('th')?.getBoundingClientRect().width ||
    width ||
    definition?.width ||
    160;
  const start = (element: HTMLElement) => {
    const widths: Record<string, number> = {};
    element
      .closest('table')
      ?.querySelectorAll<HTMLElement>('thead th')
      .forEach((cell, index) => {
        const value = cell.getBoundingClientRect().width;
        if (value > 0)
          widths[
            cell.dataset.columnKey ??
              (index === 0 ? '__selection' : '__actions')
          ] = value;
      });
    if (Object.keys(widths).length) onResizeStart?.(widths);
  };
  return (
    <span
      role='separator'
      aria-orientation='vertical'
      tabIndex={0}
      aria-label={t('collection.resizeColumn', { field })}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(clamp(width ?? definition?.width ?? 160))}
      style={{
        position: 'absolute',
        insetInlineEnd: 0,
        top: 0,
        bottom: 0,
        width: 8,
        cursor: 'col-resize',
        touchAction: 'none',
        outline: focused ? `2px solid ${colors.focus}` : 'none',
        outlineOffset: -2,
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={(event) =>
        setFocused(event.currentTarget.matches(':focus-visible'))
      }
      onBlur={() => setFocused(false)}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.focus();
        setResizing(true);
        start(event.currentTarget);
        drag.current = {
          x: event.clientX,
          width: measured(event.currentTarget),
          direction:
            getComputedStyle(event.currentTarget).direction === 'rtl' ? -1 : 1,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (drag.current)
          onResize(
            clamp(
              drag.current.width +
                (event.clientX - drag.current.x) * drag.current.direction
            )
          );
      }}
      onPointerUp={(event) => {
        drag.current = undefined;
        setResizing(false);
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        drag.current = undefined;
        setResizing(false);
      }}
      onLostPointerCapture={() => {
        drag.current = undefined;
        setResizing(false);
      }}
      onKeyDown={(event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
          return;
        event.preventDefault();
        event.stopPropagation();
        start(event.currentTarget);
        const direction =
          getComputedStyle(event.currentTarget).direction === 'rtl' ? -1 : 1;
        onResize(
          clamp(
            event.key === 'Home'
              ? min
              : event.key === 'End'
              ? max
              : measured(event.currentTarget) +
                (event.key === 'ArrowRight' ? 10 : -10) * direction
          )
        );
      }}
    >
      <span
        aria-hidden='true'
        style={{
          position: 'absolute',
          insetInlineEnd: 0,
          top: '25%',
          bottom: '25%',
          width: resizing || hovered || focused ? 2 : 1,
          backgroundColor:
            resizing || hovered || focused ? colors.active : colors.border,
          pointerEvents: 'none',
        }}
      />
    </span>
  );
};
