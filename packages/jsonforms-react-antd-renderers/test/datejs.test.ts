import dayjs from 'dayjs';
import { formatDate } from '../src/util/datejs';

describe('Date Util tester', () => {
  test('format default', () => {
    const date = dayjs('2024-01-01');
    const actual = formatDate(date, 'YYYY-MM-DD');
    expect(actual).toBe('2024-01-01');
  });

  test('format year < 1000', () => {
    const date = dayjs('2000-01-01').year(999);
    const actual = formatDate(date, 'YYYY-MM-DD');
    expect(actual).toBe('0999-01-01');
  });

  test('format 100 < year < 1000', () => {
    const date = dayjs('2000-01-01').year(99);
    const actual = formatDate(date, 'YYYY-MM-DD');
    expect(actual).toBe('0099-01-01');
  });

  test('format 10 < year < 100', () => {
    const date = dayjs('2000-01-01').year(19);
    const actual = formatDate(date, 'YYYY-MM-DD');
    expect(actual).toBe('0019-01-01');
  });
});
