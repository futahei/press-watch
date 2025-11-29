// jsdom 依存ライブラリが SharedArrayBuffer/ArrayBuffer の拡張プロパティを要求するための簡易 polyfill。
if (typeof globalThis.SharedArrayBuffer === "undefined") {
  class MockSharedArrayBuffer {}
  Object.defineProperty(MockSharedArrayBuffer.prototype, "growable", {
    get() {
      return false;
    },
  });
  // @ts-expect-error test-only polyfill
  globalThis.SharedArrayBuffer = MockSharedArrayBuffer;
}

if (
  typeof ArrayBuffer !== "undefined" &&
  !Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "resizable")
) {
  Object.defineProperty(ArrayBuffer.prototype, "resizable", {
    get() {
      return false;
    },
  });
}

if (typeof window !== "undefined") {
  await import("@testing-library/jest-dom/vitest");
}

export {};
