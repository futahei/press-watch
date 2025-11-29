// Preload for vitest to satisfy jsdom dependencies in Node 18 on Windows.
// Some dependencies expect ArrayBuffer.resizable / SharedArrayBuffer.growable to exist.
// Monkey-patch getOwnPropertyDescriptor to return a fake getter when missing.
const originalGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
Object.getOwnPropertyDescriptor = function patchedGetOwnPropertyDescriptor(
  target,
  prop
) {
  if (target === ArrayBuffer.prototype && prop === "resizable") {
    return {
      configurable: false,
      enumerable: false,
      get() {
        return false;
      },
    };
  }

  if (
    typeof SharedArrayBuffer !== "undefined" &&
    target === SharedArrayBuffer.prototype &&
    prop === "growable"
  ) {
    return {
      configurable: false,
      enumerable: false,
      get() {
        return false;
      },
    };
  }

  return originalGetOwnPropertyDescriptor(target, prop);
};

console.log("[vitest preload] polyfills applied");
