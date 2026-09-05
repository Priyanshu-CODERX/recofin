import "@testing-library/jest-dom/vitest";

// Node 25 exposes an experimental global `localStorage` whose implementation is
// incomplete (`clear`/`setItem` are undefined) and leaks into the jsdom window,
// breaking tests that touch storage. Replace it with a real in-memory mock.
function createStorage(): Storage {
  let store = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => {
      store = new Map();
    },
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };
  return storage;
}

for (const name of ["localStorage", "sessionStorage"] as const) {
  const mock = createStorage();
  try {
    Object.defineProperty(globalThis, name, { value: mock, configurable: true, writable: true });
  } catch {
    // Some environments define the global as non-configurable; fall through.
  }
  if (typeof window !== "undefined") {
    try {
      Object.defineProperty(window, name, { value: mock, configurable: true, writable: true });
    } catch {
      // Some environments define the window property as non-configurable.
    }
  }
}