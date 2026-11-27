import { useState } from 'react';
import type { ControlProps } from '@jsonforms/core';
import { useI18n } from '@chobantonov/jsonforms-react-renderer-common/locale/translate';
import {
  CRON_FIELDS,
  NOTHING_CHOSEN,
  cronProblem,
  fieldsForPeriod,
  joinCron,
  periodOf,
  parseField,
  sameExpression,
  splitCron,
  standDown,
  withTimeDefaults,
  type CronField,
  type CronPeriod,
} from './cron';

/** Keeps the cron expression, picker draft and displayed period in sync. */
export const useCronPicker = (props: ControlProps) => {
  const label = useI18n();
  const expression = typeof props.data === 'string' ? props.data : '';
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [period, setPeriod] = useState<CronPeriod>();
  const [touched, setTouched] = useState(false);
  const options = { ...props.config, ...props.uischema.options };
  const showActions = options.showActions !== false;
  const disabled = !props.enabled || Boolean(props.readonly);
  const problem =
    expression.trim() === '' ? undefined : cronProblem(expression);
  const localError = problem ? label(`cron.error.${problem}` as any) : '';
  const commit = (next: string) => {
    if (disabled || sameExpression(next, expression)) return;
    props.handleChange(props.path, next);
  };
  const draft = splitCron(text) ?? NOTHING_CHOSEN;
  const change = (next: string) => {
    setText(next);
    setTouched(true);
    if (!showActions) commit(next);
  };
  const changeField = (field: CronField, value: string) => {
    const next = [...draft];
    const chosen = value.trim() !== '' && value !== '*';
    next[CRON_FIELDS.indexOf(field)] = chosen ? value : '*';
    change(joinCron(chosen ? withTimeDefaults(next, field) : next));
  };
  const changeText = (next: string) => {
    const fields = splitCron(next);
    if (fields) setPeriod(periodOf(fields));
    change(next);
  };
  const changePeriod = (next: CronPeriod) => {
    if (disabled || next === period) return;
    setPeriod(next);
    if (next === 'second') change(joinCron(NOTHING_CHOSEN));
    else if (splitCron(text)) change(joinCron(standDown(draft, next)));
  };
  const editedProblem = text.trim() === '' ? undefined : cronProblem(text);
  const shownFields = period ? fieldsForPeriod(period) : [];
  const openOn = (next: boolean) => {
    if (disabled) return;
    if (next) {
      const fields = splitCron(expression);
      setText(expression);
      setPeriod(fields ? periodOf(fields) : undefined);
      setTouched(false);
    }
    setOpen(next);
  };
  const accept = () => {
    if (touched) commit(text);
    setOpen(false);
  };
  return {
    label,
    expression,
    open,
    setOpen,
    text,
    period,
    options,
    showActions,
    disabled,
    localError,
    draft,
    changeField,
    changeText,
    changePeriod,
    editedProblem,
    shownFields,
    hasCustomField: shownFields.some(
      (field) =>
        parseField(draft[CRON_FIELDS.indexOf(field)] ?? '*', field) ===
        undefined,
    ),
    openOn,
    accept,
  };
};
