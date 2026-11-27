/** Normalize a form locale for Intl, falling back safely for host-only catalog tags. */
export function resolveIntlLocale(locale?: string): string | undefined {
  try {
    return Intl.DateTimeFormat.supportedLocalesOf(
      locale ? [locale.replaceAll('_', '-')] : [],
    )[0];
  } catch {
    return undefined;
  }
}
