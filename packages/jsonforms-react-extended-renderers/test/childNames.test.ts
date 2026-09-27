import { describe, expect, it } from 'vitest';
import {
  ractiveTransitionAttributes,
  resolveChildNames,
} from '../src/util/childNames';

/*
  Section 13 gives unnamed children "their decimal index as a fallback name"
  and does not say what happens when that index is already somebody's explicit
  name. It can be, and the answer used to be that one child vanished.
*/

const child = (name?: string) =>
  ({
    type: 'Control',
    scope: '#/properties/x',
    ...(name ? { name } : {}),
  } as any);

describe("naming a template's children", () => {
  it('keeps explicit names', () => {
    const { names, byName } = resolveChildNames([child('body'), child('foot')]);
    expect(names).toEqual(['body', 'foot']);
    expect(byName).toEqual({ body: 0, foot: 1 });
  });

  it('falls back to the decimal index', () => {
    const { names } = resolveChildNames([child(), child()]);
    expect(names).toEqual(['0', '1']);
  });

  it('mixes the two', () => {
    const { names } = resolveChildNames([child(), child('foot'), child()]);
    expect(names).toEqual(['0', 'foot', '2']);
  });

  /*
    The bug. Child 0 is unnamed so it wants "0"; child 1 is explicitly named
    "0". Before, the explicit one overwrote the fallback in the slot map and
    **child 0 never rendered** - no partial, no dispatch, no error, and the
    control was simply missing from the form.
  */
  it('does not let an index fallback steal an explicit name', () => {
    const { names, byName, diagnostics } = resolveChildNames([
      child(),
      child('0'),
    ]);
    // The author asked for "0" on child 1, and keeps it.
    expect(byName['0']).toBe(1);
    expect(names[1]).toBe('0');
    // Child 0 cannot be addressed, and that is said out loud.
    expect(names[0]).toBeUndefined();
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toContain('template.childNameCollision');
    expect(diagnostics[0]).toContain('child 0');
  });

  /* The claim can come from a child *later* in the array. */
  it('sees a collision declared after the unnamed child', () => {
    const { names } = resolveChildNames([child(), child(), child('1')]);
    expect(names[0]).toBe('0');
    expect(names[1]).toBeUndefined();
    expect(names[2]).toBe('1');
  });

  /*
    Two children claiming one name: the first keeps it, and the second falls
    back to its index rather than becoming unplaceable. Losing the name is
    enough of a consequence - losing the child as well would be gratuitous,
    and the diagnostic already tells the author which two collided.
  */
  it('reports two children sharing one explicit name', () => {
    const { names, byName, diagnostics } = resolveChildNames([
      child('body'),
      child('body'),
    ]);
    expect(byName['body']).toBe(0);
    expect(names[1]).toBe('1');
    expect(diagnostics[0]).toContain('template.duplicateChildName');
  });

  /* An empty name addresses nothing, so the index fallback still applies. */
  it('treats an empty name as no name', () => {
    const { names } = resolveChildNames([child('')]);
    expect(names).toEqual(['0']);
  });

  it('copes with no children', () => {
    expect(resolveChildNames(undefined).names).toEqual([]);
    expect(resolveChildNames([]).diagnostics).toEqual([]);
  });
});

/*
  Attributes Ractive eats. Its parser reads `name-in`, `name-out` and
  `name-in-out` as transition directives, hard-coded and not configurable -
  so `data-out` is the transition named `data` and never reaches the DOM.
*/
describe('ractive transition attributes', () => {
  it('spots the three endings', () => {
    expect(ractiveTransitionAttributes('<p data-out>x</p>')).toEqual([
      'data-out',
    ]);
    expect(ractiveTransitionAttributes('<p data-in>x</p>')).toEqual([
      'data-in',
    ]);
    expect(ractiveTransitionAttributes('<p fade-in-out>x</p>')).toEqual([
      'fade-in-out',
    ]);
  });

  it('leaves ordinary attributes alone', () => {
    expect(
      ractiveTransitionAttributes(
        '<p data-greeting class="a" aria-hidden="true">x</p>'
      )
    ).toEqual([]);
  });

  /* `-input` is not `-in`; the pattern anchors on the whole attribute name. */
  it('does not fire on a name that merely contains in or out', () => {
    expect(
      ractiveTransitionAttributes('<p data-input data-outer data-about>x</p>')
    ).toEqual([]);
  });

  it('finds several, without repeating one', () => {
    expect(
      ractiveTransitionAttributes('<p a-out><span b-in></span><i a-out></i>')
    ).toEqual(['a-out', 'b-in']);
  });

  it('copes with an attribute that has a value', () => {
    expect(
      ractiveTransitionAttributes('<p fade-in="{opacity:0}">x</p>')
    ).toEqual(['fade-in']);
  });
});
