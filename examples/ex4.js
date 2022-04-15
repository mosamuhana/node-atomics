const { isMainThread, workerData, threadId, Worker } = require('worker_threads');
const { Mutex } = require('../');

if (isMainThread) {
  console.time('main');
  const mutex = new Mutex();
  const arr = new Int32Array(new SharedArrayBuffer(4));
  Array(5).fill(null).map(() => new Worker(__filename, { workerData: { buffer: arr.buffer, lock: mutex.buffer } }));
  process.on('exit', () => {
    console.log(arr[0]);
    console.timeEnd('main');
  });
} else {
  const mutex = Mutex.from(workerData.lock);
  //const mutex = new Mutex(workerData.lock);
  const arr = new Int32Array(workerData.buffer);
  console.log(`Thread ${threadId} started`, arr[0]);
  mutex.acquire();
  for (let i = 0; i < 10000; i++) {
    arr[0]++;
  }
  v = arr[0];
  mutex.signal();
  console.log(`Thread ${threadId} ended`, v);
}
