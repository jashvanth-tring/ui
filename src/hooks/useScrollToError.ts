import { useRef } from 'react';

type ErrorMap = Record<string, any>;

export const useScrollToError = () => {
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const registerField = (key: string) => (el: HTMLElement | null) => {
    if (el) {
      fieldRefs.current[key] = el;
    }
  };

  const scrollToError = (errors: ErrorMap) => {
    const errorKeys = Object.keys(errors);
    if (!errorKeys.length) return;

    const firstErrorKey = errorKeys.find(
      (key) => errors[key] && errors[key] !== '' && fieldRefs.current[key],
    );

    console.log('firstErrorKey:', firstErrorKey);           // 👈 debug
    console.log('refs:', fieldRefs.current);                // 👈 debug

    if (!firstErrorKey) return;

    const element = fieldRefs.current[firstErrorKey];
    if (!element) return;

    // Use registered container, else walk up DOM
    const container = scrollContainerRef.current ?? findScrollableParent(element);

    console.log('container:', container);                   // 👈 debug

    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const elRect = element.getBoundingClientRect();
    const offset = elRect.top - containerRect.top + container.scrollTop - 80;

    container.scrollTo({ top: offset, behavior: 'smooth' });

    requestAnimationFrame(() => {
      const target =
        (element.querySelector('input, select, textarea, button') as HTMLElement | null)
        ?? element;
      target?.focus({ preventScroll: true });
    });
  };

  return {
    registerField,
    scrollContainerRef, // 👈 expose this
    scrollToError,
  };
};

function findScrollableParent(el: HTMLElement): HTMLElement {
  let parent = el.parentElement;
  while (parent) {
    const { overflow, overflowY } = window.getComputedStyle(parent);
    if (/(auto|scroll)/.test(overflow + overflowY) && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return document.documentElement;
}