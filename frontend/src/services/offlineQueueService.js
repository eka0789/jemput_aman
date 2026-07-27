const DB_NAME = 'jemput_aman';
const STORE_NAME = 'offline_taps';
const DB_VERSION = 1;

const openDatabase = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const transact = async (mode, action) => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = action(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
};

export const offlineQueue = {
  enqueueTap: tapData => transact('readwrite', store => store.add({
    ...tapData,
    queuedAt: new Date().toISOString(),
    status: 'PENDING_MANUAL_REVIEW'
  })),
  getQueue: () => transact('readonly', store => store.getAll()),
  remove: id => transact('readwrite', store => store.delete(id)),
  clearQueue: () => transact('readwrite', store => store.clear())
};
