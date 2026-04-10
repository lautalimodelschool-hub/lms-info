import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getInitials = (name: string) => {
  if (!name) return '';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const formatWhatsAppLink = (phone: string) => {
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const formatted = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;
  return `https://wa.me/${formatted}`;
};

export const formatCallLink = (phone: string) => {
  return `tel:${phone || ''}`;
};
