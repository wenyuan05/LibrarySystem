export const scrollToListTop = (target) => {
  window.requestAnimationFrame(() => {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
};
