(function initStorage(root) {
  const ns = (root.AgencyExt = root.AgencyExt || {});

  async function get(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => {
        resolve(result || {});
      });
    });
  }

  async function set(values) {
    return new Promise((resolve) => {
      chrome.storage.local.set(values, () => resolve());
    });
  }

  async function remove(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(keys, () => resolve());
    });
  }

  async function appendToArray(key, item, maxLength) {
    const data = await get([key]);
    const arr = Array.isArray(data[key]) ? data[key] : [];
    arr.push(item);
    const next = Number.isFinite(maxLength) ? arr.slice(-maxLength) : arr;
    await set({ [key]: next });
    return next;
  }

  ns.storage = {
    get,
    set,
    remove,
    appendToArray,
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
