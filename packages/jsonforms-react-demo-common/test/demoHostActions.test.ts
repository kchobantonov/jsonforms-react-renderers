import { expect, it, vi } from 'vite-plus/test';
import { applyDemoHostAction } from '../src/app/demoHostActions';

it('handles portable locale and theme commands in the host', () => {
  const setLocale = vi.fn();
  const toggleMode = vi.fn();
  const host = { setLocale, toggleMode };
  expect(applyDemoHostAction('changeLang', { lang: 'bg' }, host)).toBe(true);
  expect(applyDemoHostAction('setLocale', { locale: 'en' }, host)).toBe(true);
  expect(applyDemoHostAction('toggleMode', {}, host)).toBe(true);
  expect(setLocale.mock.calls).toEqual([['bg'], ['en']]);
  expect(toggleMode).toHaveBeenCalledOnce();
  expect(applyDemoHostAction('unknown', {}, host)).toBe(false);
  expect(applyDemoHostAction('changeLang', { lang: 42 }, host)).toBe(false);
});
