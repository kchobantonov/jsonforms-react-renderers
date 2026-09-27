import { describe, expect, it } from 'vitest';
import {
  defaultUrlPolicy,
  isAllowedUrl,
  resolveUrlPolicy,
} from '../src/util/urlPolicy';

describe('the default URL policy', () => {
  it('matches the profile in section 12', () => {
    expect(defaultUrlPolicy).toEqual({
      allowedSchemes: ['https', 'http', 'mailto'],
      allowRelative: true,
      allowImageDataUrls: false,
    });
  });

  it.each(['https://example.com/help', 'http://example.com', 'mailto:a@b.c'])(
    'allows %s',
    (url) => expect(isAllowedUrl(url)).toBe(true)
  );

  it.each(['/help', 'help', './help', '../help', '?q=1', '#anchor'])(
    'allows the relative URL %s',
    (url) => expect(isAllowedUrl(url)).toBe(true)
  );

  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
  ])('refuses %s', (url) => expect(isAllowedUrl(url)).toBe(false));

  it('refuses a scheme hidden behind control characters', () => {
    // Browsers strip these before resolving the scheme, so a naive
    // startsWith('javascript:') check would be bypassed by them.
    expect(isAllowedUrl('java\nscript:alert(1)')).toBe(false);
    expect(isAllowedUrl('  javascript:alert(1)')).toBe(false);
    expect(isAllowedUrl('java\tscript:alert(1)')).toBe(false);
  });

  it('refuses a protocol-relative URL, which can leave the origin', () => {
    expect(isAllowedUrl('//evil.example.com/x')).toBe(false);
  });

  it('allows the empty href that section 13 permits', () => {
    expect(isAllowedUrl('')).toBe(true);
  });

  it('refuses a non-string', () => {
    for (const value of [undefined, null, 42, {}, []]) {
      expect(isAllowedUrl(value)).toBe(false);
    }
  });
});

describe('policy resolution', () => {
  it('uses the defaults when nothing is configured', () => {
    expect(resolveUrlPolicy(undefined)).toEqual(defaultUrlPolicy);
    expect(resolveUrlPolicy({})).toEqual(defaultUrlPolicy);
  });

  it('reads the namespaced security block', () => {
    const policy = resolveUrlPolicy({
      jsonformsExtended: {
        security: {
          urlPolicy: { allowedSchemes: ['HTTPS'], allowRelative: false },
        },
      },
    });
    expect(policy.allowedSchemes).toEqual(['https']);
    expect(policy.allowRelative).toBe(false);
    // Unsupplied members keep their documented default.
    expect(policy.allowImageDataUrls).toBe(false);
  });

  it('ignores a flat security key, which is the wrong tier', () => {
    const policy = resolveUrlPolicy({
      security: { urlPolicy: { allowedSchemes: ['ftp'] } },
    } as any);
    expect(policy).toEqual(defaultUrlPolicy);
  });

  it('honours a tightened policy', () => {
    const httpsOnly = resolveUrlPolicy({
      jsonformsExtended: {
        security: {
          urlPolicy: { allowedSchemes: ['https'], allowRelative: false },
        },
      },
    });
    expect(isAllowedUrl('https://example.com', httpsOnly)).toBe(true);
    expect(isAllowedUrl('http://example.com', httpsOnly)).toBe(false);
    expect(isAllowedUrl('/help', httpsOnly)).toBe(false);
  });
});
