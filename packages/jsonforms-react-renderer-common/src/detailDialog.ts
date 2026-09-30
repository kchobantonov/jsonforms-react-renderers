import React, { useEffect, useState } from 'react';

export type DetailDialogOptions = {
  width?: number | string;
  height?: number | string;
  maximizable?: boolean;
  draggable?: boolean;
  resizable?: boolean;
};

/** Geometry only; each renderer supplies its own dialog and controls. */
export const useDetailDialog = (open: boolean, options: DetailDialogOptions = {}) => {
  const [maximized, setMaximized] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!open) { setMaximized(false); setOffset({ x: 0, y: 0 }); }
  }, [open]);
  const frame = React.useRef<number>();
  const nextOffset = React.useRef<{ x: number; y: number }>();
  const flushOffset = () => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    frame.current = undefined;
    if (nextOffset.current) setOffset(nextOffset.current);
    nextOffset.current = undefined;
  };
  useEffect(() => () => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
  }, []);
  const drag = React.useRef<{ x: number; y: number; left: number; top: number }>();
  const onPointerDown: React.PointerEventHandler<HTMLElement> = event => {
    if (!options.draggable || maximized || event.button !== 0 ||
      (event.target as HTMLElement).closest('button')) return;
    event.preventDefault();
    drag.current = { x: event.clientX, y: event.clientY, left: offset.x, top: offset.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  return {
    offset: maximized ? { x: 0, y: 0 } : offset,
    maximized, toggle: () => setMaximized(value => !value),
    style: {
      width: maximized ? 'calc(100vw - 32px)' : options.width,
      height: maximized ? 'calc(100dvh - 32px)' : options.height,
      minWidth: 280, minHeight: 160,
      maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100dvh - 32px)',
      translate: maximized ? undefined : `${offset.x}px ${offset.y}px`,
      resize: options.resizable && !maximized ? 'both' : undefined,
      overflow: 'auto',
    } as React.CSSProperties,
    dragProps: {
      style: { cursor: options.draggable && !maximized ? 'move' : undefined, touchAction: 'none' },
      onPointerDown,
      onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
        if (!drag.current) return;
        nextOffset.current = {
          x: Math.max(-window.innerWidth / 3, Math.min(window.innerWidth / 3, drag.current.left + event.clientX - drag.current.x)),
          y: Math.max(0, Math.min(window.innerHeight / 3, drag.current.top + event.clientY - drag.current.y)),
        };
        if (frame.current === undefined) frame.current = requestAnimationFrame(flushOffset);
      },
      onPointerUp: () => { flushOffset(); drag.current = undefined; },
      onPointerCancel: () => { flushOffset(); drag.current = undefined; },
      onLostPointerCapture: () => { flushOffset(); drag.current = undefined; },
    },
  };
};
