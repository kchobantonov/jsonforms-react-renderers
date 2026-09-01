import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Source: shadcn-ui/ui, apps/v4 registry "utils" item.
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
