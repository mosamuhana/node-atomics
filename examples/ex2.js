const { isMainThread, workerData, threadId, Worker } = require('worker_threads');
const { setTimeout } = require('timers/promises');
const { AtomicLock } = require('../');

if (isMainThread) {
  console.time('main');
  const lock = new AtomicLock();
  const buffer = new SharedArrayBuffer(4);
  const arr = new Int32Array(buffer);
  Array(5).fill(null).map(() => new Worker(__filename, { workerData: { buffer: buffer, lock: lock.buffer } }));
  process.on('exit', () => {
    console.log(arr[0]);
    console.timeEnd('main');
  });
} else {
  async function main() {
    const lock = new AtomicLock(workerData.lock);
    const arr = new Int32Array(workerData.buffer);
    console.log(`Thread ${threadId} started`, arr[0]);
    const v = await lock.asynchronize(async () => {
      await setTimeout(100);
      for (let i = 0; i < 1000; i++) {
        arr[0]++;
      }
      return arr[0];
    });
    console.log(`Thread ${threadId} ended`, v);
  }

  main();
}
