// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function points(n: number) {
  return new Intl.NumberFormat('zh-CN').format(n);
}

export function minutesBetween(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / (1000 * 60);
}
