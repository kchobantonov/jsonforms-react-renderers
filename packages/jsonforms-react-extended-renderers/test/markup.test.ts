import { describe, expect, it } from 'vitest';
import {
  markdownEnabled,
  resolveMarkup,
  typographyEnabled,
  wantsMarkup,
} from '../src/util/markup';

const withMarkup = (markup: Record<string, unknown>) => ({
  jsonformsExtended: { markup },
});

describe('which renderer a text element belongs to', () => {
  /*
    Neither request present means the ordinary label renderer keeps the
    element. Taking it would change how every existing form draws its labels
    for no gain - there is nothing here it would do differently.
  */
  it('leaves a plain label alone', () => {
    expect(wantsMarkup(undefined)).toBe(false);
    expect(wantsMarkup({})).toBe(false);
    expect(wantsMarkup({ markup: 'plain' })).toBe(false);
  });

  it('takes an element asking for either capability', () => {
    expect(wantsMarkup({ markup: 'markdown' })).toBe(true);
    expect(wantsMarkup({ interpolate: true })).toBe(true);
    expect(wantsMarkup({ markup: 'markdown', interpolate: true })).toBe(true);
  });

  /*
    Read from the **requested** markup, not the resolved one. An element
    asking for Markdown the host has switched off still belongs here, because
    the refusal has to be reported; leaving it to the plain renderer would
    render the source silently.
  */
  it('takes a refused request too, so it can be reported', () => {
    expect(wantsMarkup({ markup: 'markdown' })).toBe(true);
  });

  /* `textParams` alone does nothing: interpolate defaults false. */
  it('is not triggered by textParams alone', () => {
    expect(wantsMarkup({ textParams: { name: 'x' } })).toBe(false);
  });
});

describe('the markdown gate', () => {
  /*
    Defaults **true**, unlike the gates around script evaluation. Those gate
    something that executes; this gates a parser that cannot, and the profile
    already excludes raw HTML, images and embedded content.
  */
  it('is on unless the host says otherwise', () => {
    expect(markdownEnabled(undefined)).toBe(true);
    expect(markdownEnabled({})).toBe(true);
    expect(markdownEnabled(withMarkup({ markdown: {} }))).toBe(true);
    expect(markdownEnabled(withMarkup({ markdown: { enabled: true } }))).toBe(
      true
    );
  });

  it('is off only for an explicit false', () => {
    expect(markdownEnabled(withMarkup({ markdown: { enabled: false } }))).toBe(
      false
    );
  });

  it('reports a refusal rather than parsing anyway', () => {
    const off = withMarkup({ markdown: { enabled: false } });
    expect(resolveMarkup({ markup: 'markdown' }, off)).toMatchObject({
      markdown: false,
      diagnostic: 'markdownDisabled',
    });
  });

  /*
    The two capabilities are independent, so switching the profile off is not
    a reason to stop formatting a message.
  */
  it('keeps interpolation when markdown is refused', () => {
    const off = withMarkup({ markdown: { enabled: false } });
    expect(
      resolveMarkup({ markup: 'markdown', interpolate: true }, off)
    ).toMatchObject({ markdown: false, interpolate: true });
  });

  it('reports a markup value it does not know', () => {
    expect(resolveMarkup({ markup: 'asciidoc' }, undefined)).toMatchObject({
      markdown: false,
      diagnostic: 'markupUnsupported',
    });
  });

  it('resolves an honoured request with no diagnostic', () => {
    const request = resolveMarkup({ markup: 'markdown' }, undefined);
    expect(request.markdown).toBe(true);
    expect(request.diagnostic).toBeUndefined();
  });
});

describe('the typography option', () => {
  it('defaults to the library components', () => {
    expect(typographyEnabled(undefined, undefined)).toBe(true);
  });

  it('is switchable per form', () => {
    expect(
      typographyEnabled(undefined, withMarkup({ typography: false }))
    ).toBe(false);
  });

  /*
    And per control, which wins - the components carry their own margins, and
    one label in a tight row may need them off while the rest of the form
    wants them.
  */
  it('is switchable per control, over the form default', () => {
    const formOff = withMarkup({ typography: false });
    expect(typographyEnabled({ typography: true }, formOff)).toBe(true);
    const formOn = withMarkup({ typography: true });
    expect(typographyEnabled({ typography: false }, formOn)).toBe(false);
  });
});
