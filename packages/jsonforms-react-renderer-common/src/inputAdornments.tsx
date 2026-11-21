import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { useJsonForms } from '@jsonforms/react';

export type InputAdornment =
  | { kind: 'text'; text: string; i18n?: string; tooltip?: string }
  | {
      kind: 'icon';
      icon: string;
      label: string;
      i18n?: string;
      tooltip?: string;
      decorative?: false;
    }
  | { kind: 'icon'; icon: string; decorative: true };

export function normalizeInputAdornments(value: unknown): InputAdornment[] {
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((item) => {
    if (typeof item === 'string')
      return item && !Array.isArray(value)
        ? [{ kind: 'text' as const, text: item }]
        : [];
    if (!item || typeof item !== 'object') return [];
    const entry = item as Record<string, unknown>;
    if (entry.kind === 'text' && typeof entry.text === 'string' && entry.text)
      return [entry as InputAdornment];
    if (
      entry.kind === 'icon' &&
      typeof entry.icon === 'string' &&
      entry.icon &&
      (entry.decorative === true ||
        (typeof entry.label === 'string' && entry.label))
    )
      return [entry as InputAdornment];
    return [];
  });
}

export function supportsInputAdornments(
  schema:
    | { type?: unknown; format?: unknown; contentEncoding?: unknown }
    | undefined,
  options: Record<string, unknown>,
): boolean {
  const type = schema?.type;
  if (type !== 'string' && type !== 'number' && type !== 'integer')
    return false;
  if (
    schema?.format === 'binary' ||
    schema?.format === 'byte' ||
    schema?.contentEncoding === 'base64'
  )
    return false;
  if (
    options.slider === true ||
    options.variant === 'otp' ||
    options.format === 'code' ||
    options.format === 'radio' ||
    options.showRadio === true
  )
    return false;
  return true;
}

const icons: Record<string, string> = {
  information: 'ⓘ',
  account: '◉',
  schedule: '◷',
  lock: '🔒',
};
const itemStyle: React.CSSProperties = {
  position: 'relative',
  flex: 'none',
  whiteSpace: 'nowrap',
  color: 'inherit',
};
const tooltipStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: 100,
  insetBlockStart: '100%',
  insetInlineStart: 0,
  width: 'max-content',
  maxWidth: 'min(20rem, 80vw)',
  whiteSpace: 'normal',
  padding: '.35rem .5rem',
  borderRadius: '.25rem',
  color: 'white',
  background: '#222',
};

function AdornmentItem({
  item,
  side,
}: {
  item: InputAdornment;
  side: 'start' | 'end';
}) {
  const { i18n } = useJsonForms();
  const tooltipId = useId();
  const [open, setOpen] = useState(false);
  const translate = (role: string, fallback: string) =>
    'i18n' in item && item.i18n
      ? (i18n?.translate?.(`${item.i18n}.${role}`, fallback) ?? fallback)
      : fallback;
  const label =
    item.kind === 'text'
      ? translate('text', item.text)
      : item.decorative
        ? ''
        : translate('label', (item as { label?: string }).label ?? '');
  const tooltip =
    'tooltip' in item && item.tooltip ? translate('tooltip', item.tooltip) : '';
  const content =
    item.kind === 'text'
      ? label
      : icons[item.icon] || (item.decorative ? '' : label);
  if (tooltip)
    return (
      <button
        type='button'
        data-adornment={side}
        data-kind={item.kind}
        aria-label={item.kind === 'icon' ? label : undefined}
        aria-describedby={tooltipId}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        style={{
          ...itemStyle,
          border: 0,
          background: 'transparent',
          padding: 0,
          font: 'inherit',
        }}
      >
        <span aria-hidden={item.kind === 'icon' || undefined}>{content}</span>
        <span
          id={tooltipId}
          role='tooltip'
          style={{
            ...tooltipStyle,
            ...(side === 'end'
              ? { insetInlineStart: 'auto', insetInlineEnd: 0 }
              : {}),
            display: open ? 'block' : 'none',
          }}
        >
          {tooltip}
        </span>
      </button>
    );
  return (
    <span
      data-adornment={side}
      data-kind={item.kind}
      role={item.kind === 'icon' && !item.decorative ? 'img' : undefined}
      aria-label={item.kind === 'icon' && !item.decorative ? label : undefined}
      aria-hidden={item.kind === 'icon' && item.decorative ? true : undefined}
      style={itemStyle}
    >
      {content}
    </span>
  );
}

const fieldSelectors = [
  'button[data-slot="select-trigger"]',
  '.ant-input-affix-wrapper',
  '.ant-picker',
  '.ant-input-number',
  '.ant-select',
  '.ant-select-selector',
  '.ant-input',
  'input',
  'textarea',
  'select',
  'button[aria-haspopup]',
  'button[id]',
];

function findField(root: HTMLElement): HTMLElement | null {
  for (const selector of fieldSelectors) {
    const field = root.querySelector<HTMLElement>(selector);
    if (field) return field;
  }
  return null;
}

export function InputAdornments({
  schema,
  options,
  children,
}: React.PropsWithChildren<{
  schema?: { type?: unknown; format?: unknown; contentEncoding?: unknown };
  options?: Record<string, unknown>;
}>) {
  const applied = options ?? {};
  const eligible = supportsInputAdornments(schema, applied);
  const start = eligible
    ? normalizeInputAdornments(applied.startAdornment)
    : [];
  const end = eligible ? normalizeInputAdornments(applied.endAdornment) : [];
  const hasAdornments = start.length > 0 || end.length > 0;
  const controlRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const control = controlRef.current;
    if (!control || !hasAdornments) return;
    const root = control.parentElement;
    const field = findField(control);
    if (!field) return;
    const originalStart = field.style.paddingInlineStart;
    const originalEnd = field.style.paddingInlineEnd;
    const originalTransition = field.style.transition;
    const computed = getComputedStyle(field);
    const baseStart = Number.parseFloat(computed.paddingInlineStart) || 0;
    const baseEnd = Number.parseFloat(computed.paddingInlineEnd) || 0;
    const shifted: Array<{
      element: HTMLElement;
      property: 'insetInlineStart' | 'insetInlineEnd';
      original: string;
      base: number;
    }> = [];
    for (const element of Array.from(
      control.querySelectorAll<HTMLElement>('button, div'),
    )) {
      if (
        element === field ||
        getComputedStyle(element).position !== 'absolute'
      )
        continue;
      const side = element.className.includes('start-')
        ? 'insetInlineStart'
        : element.className.includes('end-')
          ? 'insetInlineEnd'
          : undefined;
      if (!side) continue;
      shifted.push({
        element,
        property: side,
        original: element.style[side],
        base: Number.parseFloat(getComputedStyle(element)[side]) || 0,
      });
    }
    let transitionFrame = 0;
    const apply = () => {
      cancelAnimationFrame(transitionFrame);
      const startSpace = startRef.current?.offsetWidth ?? 0;
      const endSpace = endRef.current?.offsetWidth ?? 0;
      root?.style.setProperty(
        '--jf-end-adornment-space',
        endSpace ? `${endSpace + 8}px` : '0px',
      );
      field.style.transition = 'none';
      field.style.paddingInlineStart = `${baseStart + (startSpace ? startSpace + 8 : 0)}px`;
      field.style.paddingInlineEnd = `${baseEnd + (endSpace ? endSpace + 8 : 0)}px`;
      for (const { element, property, base } of shifted) {
        const space = property === 'insetInlineStart' ? startSpace : endSpace;
        if (space) element.style[property] = `${base + space + 8}px`;
      }
      transitionFrame = requestAnimationFrame(() => {
        field.style.transition = originalTransition;
      });
    };
    apply();
    const observer = new ResizeObserver(apply);
    if (startRef.current) observer.observe(startRef.current);
    if (endRef.current) observer.observe(endRef.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(transitionFrame);
      field.style.transition = originalTransition;
      root?.style.removeProperty('--jf-end-adornment-space');
      field.style.paddingInlineStart = originalStart;
      field.style.paddingInlineEnd = originalEnd;
      for (const { element, property, original } of shifted)
        element.style[property] = original;
    };
  }, [hasAdornments]);

  if (!hasAdornments) return <>{children}</>;
  return (
    <div
      data-input-adornments
      style={{ position: 'relative', width: '100%', minWidth: 0 }}
    >
      {start.length > 0 && (
        <div
          ref={startRef}
          data-adornment-group='start'
          style={{
            position: 'absolute',
            zIndex: 3,
            insetInlineStart: 8,
            insetBlockStart: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            whiteSpace: 'nowrap',
          }}
        >
          {start.map((item, index) => (
            <AdornmentItem key={`start-${index}`} item={item} side='start' />
          ))}
        </div>
      )}
      <div ref={controlRef} style={{ minWidth: 0 }}>
        {children}
      </div>
      {end.length > 0 && (
        <div
          ref={endRef}
          data-adornment-group='end'
          style={{
            position: 'absolute',
            zIndex: 3,
            insetInlineEnd: 8,
            insetBlockStart: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            whiteSpace: 'nowrap',
          }}
        >
          {end.map((item, index) => (
            <AdornmentItem key={`end-${index}`} item={item} side='end' />
          ))}
        </div>
      )}
    </div>
  );
}
