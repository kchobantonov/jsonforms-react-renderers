import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Ractive from 'ractive';
import { sanitizeUrlAttributes } from '../util/templateUrls';
import { UrlPolicy, defaultUrlPolicy } from '../util/urlPolicy';

Ractive.DEBUG = false;

/**
 * The Ractive template profile, rendered inside React.
 *
 * Ractive owns a DOM subtree and patches it surgically: `ractive.set('data.x',
 * v)` updates the bound text nodes and nothing else. React cannot render into
 * that subtree directly, so each named child is a **placeholder element** in
 * the template, and React portals the delegated renderer into it.
 *
 * That division is what makes this worth having: a data change repaints the
 * bound text without the template function re-running and without the slotted
 * controls remounting, so focus, caret and local state survive.
 *
 * Two things this has to get right, both learned the hard way:
 *
 * - **Placeholders are re-reported after every update.** A placeholder inside
 *   `{{#if}}` or `{{#each}}` is a different DOM node after the condition
 *   changes, and a portal aimed at the old node renders into a detached
 *   element - visibly nothing. The slot list is therefore refreshed on every
 *   `set`, not captured once on mount.
 * - **Portals are keyed by slot name**, so a child keeps its React identity
 *   across those refreshes and is not remounted.
 */

export interface RactiveTemplateProps {
  template: string;
  /** Generated placeholder partials, one per named child. */
  partials?: Record<string, string>;
  /** Bindings the specification names: data, errors, context, elements, translate. */
  data: Record<string, unknown>;
  /** Delegated child renderers, by name. */
  slots: Record<string, React.ReactNode>;
  /** Section 12's URL policy, applied to whatever the template rendered. */
  urlPolicy?: UrlPolicy;
  onError?: (message: string) => void;
}

interface Placeholder {
  name: string;
  el: HTMLElement;
}

/** Ractive mounts into this attribute; React portals into what it finds. */
const SLOT_ATTR = 'data-jsonforms-slot';

export const RactiveTemplate = ({
  template,
  partials,
  data,
  slots,
  urlPolicy,
  onError,
}: RactiveTemplateProps) => {
  const host = useRef<HTMLDivElement>(null);
  const instance = useRef<Ractive<Ractive> | null>(null);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);

  /*
    Reported after mount and after every data change. The identity of the
    array changes each time, but the elements are compared by name below, so a
    stable placeholder does not cause a re-render loop.
  */
  /*
    Section 12's URL policy, applied to the subtree Ractive just rendered.

    Ractive owns this DOM and exposes no hook for a bound attribute value, so
    unlike the JSX profile - where the pragma sees the props before the element
    exists - this necessarily runs *after* the attribute has been written. It
    runs in the same synchronous block as the render that wrote it, so nothing
    has painted and no click can have arrived: `javascript:` in an `href`, the
    case that actually executes attacker code, is gone before it is reachable.
    A `src` may have begun loading, which is the honest limit of doing it here.
  */
  const policyRef = useRef<UrlPolicy>(urlPolicy ?? defaultUrlPolicy);
  policyRef.current = urlPolicy ?? defaultUrlPolicy;

  const sanitize = () => {
    if (host.current) {
      sanitizeUrlAttributes(host.current, policyRef.current);
    }
  };

  const reportPlaceholders = () => {
    const container = host.current;
    if (!container) return;
    sanitize();
    const found = Array.from(
      container.querySelectorAll<HTMLElement>(`[${SLOT_ATTR}]`)
    ).map((el) => ({ name: el.getAttribute(SLOT_ATTR) ?? '', el }));
    setPlaceholders((current) =>
      current.length === found.length &&
      current.every((slot, index) => slot.el === found[index].el)
        ? current
        : found
    );
  };

  // Mount, and rebuild only when the template string itself changes.
  useEffect(() => {
    const container = host.current;
    if (!container) return undefined;
    try {
      instance.current = new Ractive({
        el: container,
        template,
        partials,
        data: { ...data },
      });
      reportPlaceholders();
    } catch (error) {
      onError?.((error as Error).message);
    }
    return () => {
      instance.current?.teardown();
      instance.current = null;
      setPlaceholders([]);
    };
    // Partials are derived from the child names, so the template string and
    // the partial set change together.
  }, [template, partials]);

  /*
    The surgical half. Each binding is `set` by keypath, so Ractive patches
    only the nodes that read it - the template is not re-rendered and the
    portalled children are untouched.
  */
  useEffect(() => {
    const ractive = instance.current;
    if (!ractive) return;
    try {
      for (const [key, value] of Object.entries(data)) {
        ractive.set(key, value);
      }
      reportPlaceholders();
    } catch (error) {
      onError?.((error as Error).message);
    }
  }, [data]);

  return (
    <>
      <div ref={host} data-ractive-template />
      {placeholders.map(({ name, el }) =>
        slots[name] === undefined
          ? null
          : createPortal(slots[name], el, `slot-${name}`)
      )}
    </>
  );
};
