import dayjs from 'dayjs';
import { formatDate } from '@chobantonov/jsonforms-react-renderer-common/formats/dateValues';
export {
  formatDate,
  parseDateValue as getData,
} from '@chobantonov/jsonforms-react-renderer-common/formats/dateValues';

export const createOnChangeHandler =
  (
    path: string,
    handleChange: (path: string, value: any) => void,
    saveFormat: string,
  ) =>
  (value: dayjs.Dayjs) => {
    if (!value) {
      handleChange(path, undefined);
    } else if (value.isValid()) {
      const formattedDate = formatDate(value, saveFormat);
      handleChange(path, formattedDate);
    }
  };

export const createOnBlurHandler =
  (
    path: string,
    handleChange: (path: string, value: any) => void,
    format: string,
    saveFormat: string,
    rerenderChild: () => void,
    onBlur: () => void,
  ) =>
  (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement, Element>) => {
    const date = dayjs(e.target.value, format);
    const formattedDate = formatDate(date, saveFormat);
    if (formattedDate.toString() === 'Invalid Date') {
      handleChange(path, undefined);
      rerenderChild();
    } else {
      handleChange(path, formattedDate);
    }
    onBlur();
  };
