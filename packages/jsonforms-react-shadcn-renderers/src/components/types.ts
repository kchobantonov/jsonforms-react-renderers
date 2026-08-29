import type React from 'react';

export type ShadcnButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
    size?: 'default' | 'sm' | 'lg' | 'icon';
  };

export type ShadcnCheckboxProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange'
> & {
  checked?: boolean | 'indeterminate';
  onCheckedChange?(checked: boolean): void;
};

export type ShadcnSelectOption = {
  label: React.ReactNode;
  value: string;
};

export type ShadcnSelectProps = {
  'aria-label'?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  onBlur?: React.FocusEventHandler<HTMLElement>;
  onFocus?: React.FocusEventHandler<HTMLElement>;
  onValueChange(value: string): void;
  options: ShadcnSelectOption[];
  placeholder?: string;
  required?: boolean;
  value?: string;
};

export type ShadcnTabsItem = {
  content: React.ReactNode;
  label: React.ReactNode;
  value: string;
};

export type ShadcnTabsProps = {
  className?: string;
  items: ShadcnTabsItem[];
  onValueChange(value: string): void;
  value: string;
};

export type ShadcnAlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'destructive';
};

export type ShadcnComponentSet = {
  Alert: React.ComponentType<ShadcnAlertProps>;
  Button: React.ComponentType<ShadcnButtonProps>;
  Checkbox: React.ComponentType<ShadcnCheckboxProps>;
  Input: React.ComponentType<React.InputHTMLAttributes<HTMLInputElement>>;
  Select: React.ComponentType<ShadcnSelectProps>;
  Tabs: React.ComponentType<ShadcnTabsProps>;
};
