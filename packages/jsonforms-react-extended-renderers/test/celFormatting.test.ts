import { describe, expect, it } from 'vitest';
import { renderTemplate, resolveTextParams } from '../src/util/celTemplate';
import {
  buildNamespaceScope,
  buildTextScope,
  splitTemplate,
} from '../src/util/interpolate';

/**
 * Locale-aware formatting, which an expression language does not have and
 * which a translated string needs: a locale decides not only which words
 * appear but how a number, a price and a date are written.
 */

const render = (
  template: string,
  locale: string,
  params: Record<string, unknown>,
  data: unknown = {}
) => {
  const ns = buildNamespaceScope({ data, locale, dynamicAllowed: true });
  const resolved = resolveTextParams(params, ns, locale);
  const out = renderTemplate(
    splitTemplate(template),
    buildTextScope(resolved.params, locale),
    undefined,
    locale
  );
  return { text: out.text, failures: [...resolved.failures, ...out.failures] };
};

describe('numbers follow the locale', () => {
  it('formats a decimal separator per language', () => {
    const p = { amount: '{data.v}' };
    const d = { v: 1234.5 };
    expect(render('{number(amount)}', 'en', p, d).text).toBe('1,234.5');
    expect(render('{number(amount)}', 'de', p, d).text).toBe('1.234,5');
    expect(render('{number(amount)}', 'bg', p, d).text).toBe('1234,5');
  });

  it('formats a currency, symbol and placement included', () => {
    const out = (locale: string) =>
      render(
        '{currency(amount, "EUR")}',
        locale,
        { amount: '{data.v}' },
        {
          v: 148.5,
        }
      ).text;
    // The symbol moves; that is the whole reason this cannot be done by hand.
    expect(out('en')).toContain('148.50');
    expect(out('de')).toContain('148,50');
    expect(out('de')).toContain('€');
  });

  it('takes an explicit number of fraction digits', () => {
    expect(
      render('{number(amount, 2)}', 'en', { amount: '{data.v}' }, { v: 3 }).text
    ).toBe('3.00');
  });

  /*
    An unformatted value is NOT localized, which is deliberate: formatting
    every number on the way out would render an order number or a year with
    a thousands separator, and there would be no way to opt out.
  */
  it('leaves an unformatted number alone', () => {
    expect(render('{ref}', 'de', { ref: '{data.v}' }, { v: 2026 }).text).toBe(
      '2026'
    );
  });
});

describe('the three JSON temporal formats', () => {
  /*
    `data` holds JSON, so a temporal value is always a **string** - whatever
    the schema's `format` said. The three parse very differently and treating
    them alike is wrong in two of the three cases, so each has a test.
  */
  const fmt = (fn: string, value: string, locale = 'en') =>
    render(`{${fn}(v)}`, locale, { v: '{data.v}' }, { v: value });

  it('formats a calendar date without sliding a day', () => {
    // `2026-10-01` read in a western zone is 30 September. It must not be.
    expect(fmt('date', '2026-10-01').text).toBe('Oct 1, 2026');
    expect(fmt('date', '2026-01-01').text).toBe('Jan 1, 2026');
  });

  it('formats a time-only value, which has no date to parse', () => {
    // `new Date("14:30:00")` is Invalid Date; the value needs an anchor.
    const out = fmt('time', '14:30:00');
    expect(out.failures).toEqual([]);
    expect(out.text).toBe('2:30 PM');
  });

  it('shows a date-time in the reader own zone, not UTC', () => {
    /*
      A date-time denotes an instant. Pinning it to UTC would display a time
      nobody asked for, so this one is formatted in the ambient zone - which
      is what makes it differ from the calendar-date case above.
    */
    const utcNoon = '2026-10-01T12:00:00Z';
    const expected = new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(utcNoon));
    expect(fmt('dateTime', utcNoon).text).toBe(expected);
  });

  it('respects an offset rather than discarding it', () => {
    const withOffset = '2026-10-01T14:30:00+02:00';
    const asUtc = '2026-10-01T12:30:00Z';
    // The two denote the same instant, so they must render identically.
    expect(fmt('dateTime', withOffset).text).toBe(fmt('dateTime', asUtc).text);
  });
});

describe('dates follow the locale', () => {
  it('formats a calendar date per language', () => {
    const p = { d: '{data.v}' };
    const v = { v: '2026-09-26' };
    expect(render('{date(d)}', 'en', p, v).text).toBe('Sep 26, 2026');
    expect(render('{date(d)}', 'de', p, v).text).toBe('26.09.2026');
  });

  it('reports a value that is not a date', () => {
    const out = render(
      '{date(d)}',
      'en',
      { d: '{data.v}' },
      { v: 'not a date' }
    );
    expect(out.failures).toHaveLength(1);
    expect(out.text).toBe('');
  });
});

describe('the formatters do not widen the security surface', () => {
  it('still refuses an unregistered function', () => {
    const out = render('{alert("x")}', 'en', {});
    expect(out.failures).toHaveLength(1);
    expect(out.text).toBe('');
  });

  it('still refuses an undeclared identifier', () => {
    const out = render('{nope}', 'en', { known: 'x' });
    expect(out.failures.join(' ')).toContain('nope');
  });
});

describe('translate, in a parameter value', () => {
  const tr = (key: string, fallback?: string) =>
    ((
      { 'plan.Team': 'Екип', 'plan.Starter': 'Начален' } as Record<
        string,
        string
      >
    )[key] ?? fallback);

  const viaParam = (value: string, data: unknown, locale = 'bg') => {
    const ns = buildNamespaceScope({ data, locale, dynamicAllowed: true });
    const resolved = resolveTextParams({ v: value }, ns, locale, tr);
    const out = renderTemplate(
      splitTemplate('{v}'),
      buildTextScope(resolved.params, locale),
      undefined,
      locale,
      tr
    );
    return {
      text: out.text,
      failures: [...resolved.failures, ...out.failures],
    };
  };

  /*
    A data value is a key, not a word: `plan` is "Team" in every language.
    Looking it up belongs in the PARAMETER, because the call is identical in
    every language - put it in the text and each translator has to reproduce
    it, and one who drops it silently gets "Team" instead of "Екип".
  */
  it('looks a data value up as a key', () => {
    const out = viaParam('{translate("plan." + data.plan)}', { plan: 'Team' });
    expect(out.text).toBe('Екип');
    expect(out.failures).toEqual([]);
  });

  /*
    A guard for the shape of the call rather than for the library: the
    single-expression fast path resolves a parameter through its own call
    site, and that call site once lost the translator while the slower path
    kept it - so `translate` worked in a sentence and not on its own.
  */
  it('is available on the single-expression path and the mixed one alike', () => {
    expect(viaParam('{translate("plan.Team")}', {}).text).toBe('Екип');
    expect(viaParam('Plan: {translate("plan.Team")}', {}).text).toBe(
      'Plan: Екип'
    );
  });

  it('falls back to the key when the catalog has no entry', () => {
    expect(viaParam('{translate("plan.Unknown")}', {}).text).toBe(
      'plan.Unknown'
    );
  });

  it('takes an explicit fallback', () => {
    expect(viaParam('{translate("plan.Unknown", "Custom")}', {}).text).toBe(
      'Custom'
    );
  });
});
