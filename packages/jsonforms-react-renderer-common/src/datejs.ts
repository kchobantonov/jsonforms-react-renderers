import dayjs from 'dayjs';
import customParsing from 'dayjs/plugin/customParseFormat';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import localeData from 'dayjs/plugin/localeData';
import weekday from 'dayjs/plugin/weekday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekYear from 'dayjs/plugin/weekYear';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone'; // dependent on utc plugin

// required for the custom save formats in the date, time and date-time pickers
dayjs.extend(customParsing);
dayjs.extend(advancedFormat);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);
dayjs.extend(utc);
dayjs.extend(timezone);

export const formatDate = (date: dayjs.Dayjs, saveFormat: string) => {
  const yearToken = '__JSONFORMS_FOUR_DIGIT_YEAR__';
  const formatWithYearPlaceholder = saveFormat.replace(
    /YYYY/g,
    `[${yearToken}]`
  );

  return date
    .format(formatWithYearPlaceholder)
    .replace(new RegExp(yearToken, 'g'), String(date.year()).padStart(4, '0'));
};

export const getData = (
  data: any,
  format: string | string[] | undefined
): dayjs.Dayjs | null => {
  if (!data) {
    return null;
  }
  const dayjsData = dayjs(data, format);
  if (!dayjsData.isValid()) {
    return null;
  }
  return dayjsData;
};
