type StorageModule = typeof import('..');

function loadStorage(): StorageModule {
  let mod!: StorageModule;
  jest.isolateModules(() => {
    mod = require('..') as StorageModule;
  });
  return mod;
}

afterEach(() => {
  delete (globalThis as { NitroModulesProxy?: unknown }).NitroModulesProxy;
});

describe('storage backend', () => {
  it('falls back to the expo-sqlite key-value store when Nitro is missing (Expo Go)', () => {
    const { storage, getJSON, setJSON, removeKey } = loadStorage();
    expect(storage.name).toBe('sqlite-kv');

    setJSON('k', { a: 1 });
    expect(getJSON('k')).toEqual({ a: 1 });
    removeKey('k');
    expect(getJSON('k')).toBeUndefined();
  });

  it('uses MMKV when the Nitro native module is installed (dev and store builds)', () => {
    (globalThis as { NitroModulesProxy?: unknown }).NitroModulesProxy = {};
    const { storage, getJSON, setJSON } = loadStorage();
    expect(storage.name).toBe('mmkv');

    setJSON('k', [1, 2]);
    expect(getJSON('k')).toEqual([1, 2]);
  });
});
