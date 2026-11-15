import '@testing-library/jest-dom/vitest';

if (typeof window !== 'undefined') {
  if (!('speechSynthesis' in window)) {
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        cancel: () => {},
        speak: () => {},
      },
      writable: true,
    });
  }

  if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = (() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  }
}
