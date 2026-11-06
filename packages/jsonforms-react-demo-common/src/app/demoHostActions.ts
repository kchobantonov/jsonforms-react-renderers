/** Named commands implemented by the demo host for portable examples. */
export function applyDemoHostAction(
  action: string,
  params: Record<string, unknown> | undefined,
  host: {
    setLocale: (locale: string) => void;
    toggleMode: () => void;
  },
): boolean {
  if (action === 'setLocale' || action === 'changeLang') {
    const locale = params?.locale ?? params?.lang;
    if (typeof locale !== 'string' || locale.length === 0) return false;
    host.setLocale(locale);
    return true;
  }
  if (action === 'toggleMode') {
    host.toggleMode();
    return true;
  }
  return false;
}
