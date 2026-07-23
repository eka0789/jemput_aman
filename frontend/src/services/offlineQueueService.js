const QUEUE_KEY = 'jemput_aman_offline_queue';

export const offlineQueue = {
  enqueueTap: (tapData) => {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    queue.push({
      ...tapData,
      queuedAt: new Date().toISOString()
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },
  getQueue: () => {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  },
  clearQueue: () => {
    localStorage.removeItem(QUEUE_KEY);
  }
};
