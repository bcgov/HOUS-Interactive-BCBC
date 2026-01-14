import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function formatArticleNumber(
  division: string,
  part: number,
  section: number,
  subsection: number,
  article: number
): string {
  return `${division}.${part}.${section}.${subsection}.${article}`;
}

export function parseArticleNumber(articleNumber: string): {
  division: string;
  part: number;
  section: number;
  subsection: number;
  article: number;
} | null {
  const match = articleNumber.match(/^([A-C])\.(\d+)\.(\d+)\.(\d+)\.(\d+)$/i);
  
  if (!match) return null;
  
  return {
    division: match[1],
    part: parseInt(match[2]),
    section: parseInt(match[3]),
    subsection: parseInt(match[4]),
    article: parseInt(match[5])
  };
}

export function highlightText(text: string, query: string): string {
  if (!query) return text;
  
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 px-0.5">$1</mark>');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function stripHtmlTags(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
