import { describe, it, expect } from 'vitest';
import { compositeSummaryPresentation } from '../src/compositeSummary';
import { i18nDefaults } from '../src/i18nDefaults';

const summary = { type: 'Control', scope: '#/properties/city' };
const present = (data: unknown, descriptor: any = summary) => compositeSummaryPresentation(
  data, descriptor, 'Contact', (_key, fallback) => fallback!, key => i18nDefaults[key]
);

describe('composite summary presentation', () => {
  it('distinguishes missing, empty, unspecified and literal values', () => {
    expect(present(undefined)).toEqual({ text: 'Not set', generated: true });
    expect(present({})).toEqual({ text: 'Empty object', generated: true });
    expect(present({ phone: '123' })).toEqual({ text: 'City not specified', generated: true });
    expect(present({ city: 'Contact' })).toEqual({ text: 'Contact', generated: false });
    expect(present({ city: '  ', phone: '123' }).generated).toBe(true);
    expect(present({ city: 0 })).toEqual({ text: '0', generated: false });
    expect(present({ city: false })).toEqual({ text: 'false', generated: false });
  });
  it('distinguishes generated counts from previews', () => {
    expect(present([])).toEqual({ text: '0 items', generated: true });
    expect(present([{}, {}])).toEqual({ text: '2 items', generated: true });
    expect(present([{ city: 'London' }])).toEqual({ text: 'London', generated: false });
  });
});
