import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges class names together and resolves Tailwind CSS conflicts
 * @param {...ClassValue} inputs - Class names or class name objects/arrays
 * @returns {string} Merged and conflict-resolved class string
 * @example
 * cn('px-2', 'py-4') // → 'px-2 py-4'
 * cn('px-2 py-4', ['bg-red-500', 'text-white']) // → 'px-2 py-4 bg-red-500 text-white'
 */
export function cn(...inputs: ClassValue[]): string {
  if (!inputs || inputs.length === 0) return ''
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string into a readable format
 * @param {string|Date} date - Date to format
 * @param {Intl.DateTimeFormatOptions} [options] - Formatting options
 * @returns {string} Formatted date string
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
): string {
  return new Date(date).toLocaleDateString(undefined, options)
}

/**
 * Truncates text to a specified length and adds ellipsis if truncated
 * @param {string} text - Text to truncate
 * @param {number} [length=100] - Maximum length before truncation
 * @returns {string} Truncated text
 */
export function truncate(text: string, length: number = 100): string {
  if (!text) return ''
  return text.length > length ? `${text.substring(0, length)}...` : text
}

/**
 * Generates a unique ID
 * @returns {string} Unique ID string
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}                    