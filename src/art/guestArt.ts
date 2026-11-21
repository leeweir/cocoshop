import type { CustomerDef } from '../game/types';

const files = import.meta.glob<string>('./characters/*.webp', { eager: true, query: '?url', import: 'default' });
export type PortraitExpression = 'smile' | 'happy' | 'blink' | 'worried' | 'sad';

export function guestArtUrl(id: string, view: 'poses' | 'smile' | 'happy' | 'worried'): string {
  return files[`./characters/${id}-${view}.webp`];
}

export function portraitImg(customer: CustomerDef, expression: PortraitExpression = 'smile', className = ''): string {
  const view = expression === 'sad' ? 'worried' : expression === 'blink' ? 'happy' : expression;
  return `<img class="portrait-img ${className}" src="${guestArtUrl(customer.id, view)}" alt="${customer.name}" draggable="false" />`;
}
