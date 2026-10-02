import { useJsonForms } from '@jsonforms/react';
import React, { useEffect, useState } from 'react';

export type DetailDialogOptions = {
  width?: number | string;
  height?: number | string;
  maximizable?: boolean;
  draggable?: boolean;
  resizable?: boolean;
};

/** Geometry only; each renderer supplies its own dialog and controls. */
export const useDetailDialog = (
  open: boolean,
  options: DetailDialogOptions = {},
  getSurface?: () => HTMLElement | null | undefined
) => {
  const config = useJsonForms().config;
  options = { ...config?.jsonformsExtended?.dialog, ...options };
  const [maximized, setMaximized] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!open) {
      setMaximized(false);
      setOffset({ x: 0, y: 0 });
    }
  }, [open]);
  const frame = React.useRef<number>();
  const nextOffset = React.useRef<{ x: number; y: number }>();
  const flushOffset = () => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    frame.current = undefined;
    if (nextOffset.current) setOffset(nextOffset.current);
    nextOffset.current = undefined;
  };
  useEffect(
    () => () => {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    },
    []
  );
  const drag = React.useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
    bounds: { left: number; top: number; right: number; bottom: number };
  }>();
  const onPointerDown: React.PointerEventHandler<HTMLElement> = (event) => {
    if (
      !options.draggable ||
      maximized ||
      event.button !== 0 ||
      (event.target as HTMLElement).closest('button')
    )
      return;
    event.preventDefault();
    const surface =
      getSurface?.() ??
      event.currentTarget.closest<HTMLElement>('[role="dialog"]');
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      left: offset.x,
      top: offset.y,
      bounds: {
        left: offset.x - rect.left,
        top: offset.y - rect.top,
        right:
          offset.x + Math.max(0, window.innerWidth - rect.width) - rect.left,
        bottom:
          offset.y + Math.max(0, window.innerHeight - rect.height) - rect.top,
      },
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  return {
    options,
    offset: maximized ? { x: 0, y: 0 } : offset,
    maximized,
    toggle: () => setMaximized((value) => !value),
    style: {
      width: maximized ? 'calc(100vw - 32px)' : options.width,
      height: maximized ? 'calc(100dvh - 32px)' : options.height,
      minWidth: 280,
      minHeight: 160,
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: 'calc(100dvh - 32px)',
      translate: maximized ? undefined : `${offset.x}px ${offset.y}px`,
      resize: options.resizable && !maximized ? 'both' : undefined,
      overflow: 'auto',
    } as React.CSSProperties,
    dragProps: {
      style: {
        cursor: options.draggable && !maximized ? 'move' : undefined,
        touchAction: 'none',
      },
      onPointerDown,
      onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
        if (!drag.current) return;
        nextOffset.current = {
          x: Math.max(
            drag.current.bounds.left,
            Math.min(
              drag.current.bounds.right,
              drag.current.left + event.clientX - drag.current.x
            )
          ),
          y: Math.max(
            drag.current.bounds.top,
            Math.min(
              drag.current.bounds.bottom,
              drag.current.top + event.clientY - drag.current.y
            )
          ),
        };
        if (frame.current === undefined)
          frame.current = requestAnimationFrame(flushOffset);
      },
      onPointerUp: () => {
        flushOffset();
        drag.current = undefined;
      },
      onPointerCancel: () => {
        flushOffset();
        drag.current = undefined;
      },
      onLostPointerCapture: () => {
        flushOffset();
        drag.current = undefined;
      },
    },
  };
};
