/** Reproducible localization adapters around the pinned upstream UI sources. */
export function localizeShadcn(file, source) {
  if (file === 'calendar.tsx') {
    return source
      .replace(
        '"use client"\n',
        '"use client"\nimport { useCalendarLocalization } from "@chobantonov/jsonforms-react-renderer-common/locale/calendar"\n',
      )
      .replace('  formatters,\n', '  formatters,\n  labels,\n')
      .replace(
        '  const defaultClassNames',
        '  const localization = useCalendarLocalization(props.locale?.code)\n  const defaultClassNames',
      )
      .replace(
        '        formatMonthDropdown: (date) =>\n          date.toLocaleString("default", { month: "short" }),',
        '        ...localization.formatters,',
      )
      .replace(
        '      classNames={{',
        '      labels={{ ...localization.labels, ...labels }}\n      classNames={{',
      );
  }
  const hooks = {
    'dialog.tsx': [
      '  return (\n    <DialogPortal data-slot="dialog-portal">',
      '  return (\n    <div\n      data-slot="dialog-footer"',
    ],
    'breadcrumb.tsx': [
      '  return <nav',
      '  return (\n    <span\n      data-slot="breadcrumb-ellipsis"',
    ],
    'pagination.tsx': [
      '  return (\n    <nav',
      '  return (\n    <PaginationLink\n      aria-label="Go to previous page"',
      '  return (\n    <PaginationLink\n      aria-label="Go to next page"',
      '  return (\n    <span\n      aria-hidden',
    ],
  };
  if (!hooks[file]) return source;
  const importHook =
    'import { useI18n } from "@chobantonov/jsonforms-react-renderer-common/locale/translate"\n';
  let result = source.replace(
    'import * as React',
    importHook + 'import * as React',
  );
  for (const marker of hooks[file])
    result = result.replace(marker, '  const t = useI18n()\n' + marker);
  return translateLiterals(result);
}

function translateLiterals(result) {
  for (const [text, key] of Object.entries({
    Close: 'control.close',
    More: 'control.more',
    Previous: 'collection.previousLabel',
    Next: 'collection.nextLabel',
    'More pages': 'collection.morePages',
  })) {
    result = result.replaceAll('>' + text + '<', '>{t("' + key + '")}<');
  }
  for (const [text, key] of Object.entries({
    breadcrumb: 'breadcrumb.label',
    pagination: 'collection.pagination',
    'Go to previous page': 'collection.previous',
    'Go to next page': 'collection.next',
  })) {
    result = result.replaceAll(
      'aria-label="' + text + '"',
      'aria-label={t("' + key + '")}',
    );
  }
  return result;
}
