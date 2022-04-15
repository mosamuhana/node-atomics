const { isMainThread, workerData, threadId, Worker } = require('worker_threads');
const { AtomicLock } = require('../');

function waitWorker(worker) {
  return new Promise((resolve) => {
    worker.on('exit', () => {
      console.log(`Thread ${worker.threadId} exited`);
      resolve();
    });
  });
}

async function mainThread() {
  console.time('main');
  const lock = new AtomicLock();
  const arr = new Int32Array(new SharedArrayBuffer(4));

  const runTask = (id) => {
    const worker = new Worker(__filename, { workerData: { data: arr.buffer, lock: lock.buffer, id } });
    return new Promise((resolve, reject) => {
      worker.on('exit', () => {
        console.log(`Thread ${id} exited`);
        resolve();
      });
      worker.on('error', err => reject(err));
    });
  }

  await Promise.all( Array(5).fill(null).map((_, id) => runTask(id)) );

  console.log('RESULT:', arr[0]);
  console.timeEnd('main');
}

async function workerThread() {
  const { setTimeout } = require('timers/promises');

  const id = workerData.id;
  const lock = new AtomicLock(workerData.lock);
  const arr = new Int32Array(workerData.data);
  //console.log(`Thread ${id} started`, arr[0]);
  const v = await lock.asynchronize(async () => {
    await setTimeout(10);
    for (let i = 0; i < 1000; i++) {
      arr[0]++;
    }
    return arr[0];
  });
  console.log(`Thread ${id} ended`, v);
}

if (isMainThread) {
  mainThread();
} else {
  workerThread();
}
