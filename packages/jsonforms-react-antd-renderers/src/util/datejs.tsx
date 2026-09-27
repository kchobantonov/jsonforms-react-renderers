import dayjs from 'dayjs';
import { formatDate } from '@chobantonov/jsonforms-react-renderer-common/datejs';
export {
  formatDate,
  getData,
} from '@chobantonov/jsonforms-react-renderer-common/datejs';

export const createOnChangeHandler =
  (
    path: string,
    handleChange: (path: string, value: any) => void,
    saveFormat: string
  ) =>
  (value: dayjs.Dayjs) => {
    if (!value) {
      handleChange(path, undefined);
    } else if (value.isValid()) {
      const formatedDate = formatDate(value, saveFormat);
      handleChange(path, formatedDate);
    }
  };

export const createOnBlurHandler =
  (
    path: string,
    handleChange: (path: string, value: any) => void,
    format: string,
    saveFormat: string,
    rerenderChild: () => void,
    onBlur: () => void
  ) =>
  (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement, Element>) => {
    const date = dayjs(e.target.value, format);
    const formatedDate = formatDate(date, saveFormat);
    if (formatedDate.toString() === 'Invalid Date') {
      handleChange(path, undefined);
      rerenderChild();
    } else {
      handleChange(path, formatedDate);
    }
    onBlur();
  };
