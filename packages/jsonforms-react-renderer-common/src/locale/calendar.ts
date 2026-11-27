import { resolveIntlLocale } from './intl';
import { useJsonForms } from '@jsonforms/react';
import { useMemo } from 'react';
import { useI18n } from './translate';

/** Locale-sensitive calendar text, independent of a specific UI library. */
export function useCalendarLocalization(explicitLocale?: string) {
  const t = useI18n();
  const formLocale = useJsonForms().i18n?.locale;
  const locale = explicitLocale ?? formLocale;
  const formats = useMemo(() => {
    const supported = resolveIntlLocale(locale);
    const formatter = (options: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(supported, options).format;
    return {
      month: formatter({ month: 'short' }),
      caption: formatter({ month: 'long', year: 'numeric' }),
      weekday: formatter({ weekday: 'short' }),
      fullWeekday: formatter({ weekday: 'long' }),
      date: formatter({
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      day: formatter({ day: 'numeric' }),
      year: formatter({ year: 'numeric' }),
    };
  }, [locale]);
  return {
    formatters: {
      formatMonthDropdown: formats.month,
      formatCaption: formats.caption,
      formatYearDropdown: formats.year,
      formatWeekdayName: formats.weekday,
      formatDay: formats.day,
    },
    labels: {
      labelNav: () => t('calendar.navigation'),
      labelNext: () => t('calendar.nextMonth'),
      labelPrevious: () => t('calendar.previousMonth'),
      labelMonthDropdown: () => t('calendar.chooseMonth'),
      labelYearDropdown: () => t('calendar.chooseYear'),
      labelGrid: formats.caption,
      labelWeekday: formats.fullWeekday,
      labelGridcell: (date: Date) => formats.date(date),
      labelDayButton: (date: Date, modifiers: Record<string, boolean>) =>
        t('calendar.day', {
          date: formats.date(date),
          selected: modifiers.selected ? t('calendar.selected') : '',
          today: modifiers.today ? t('calendar.today') : '',
        }),
      labelWeekNumber: (week: number) => t('calendar.weekNumber', { week }),
      labelWeekNumberHeader: () => t('calendar.weekNumberHeader'),
    },
  };
}
