const { isMainThread, workerData, threadId, Worker } = require('worker_threads');
const delay = require('timers/promises').setTimeout;

const { Mutex } = require('../');

async function mainThread() {
  console.time('main');
  const mutex = new Mutex();
  const arr = new Int32Array(new SharedArrayBuffer(4));

  const runTask = (id) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, { workerData: { data: arr.buffer, mutex: mutex.buffer, id } });
      worker.on('exit', () => {
        console.log(`Thread ${id} exited`);
        resolve();
      });
      worker.on('error', err => reject(err));
    });
  }
  await Promise.all( Array(5).fill(null).map((_, id) => runTask(id)) );

  //await delay(1000);
  console.log('RESULT:', arr[0]);
  console.timeEnd('main');
}

async function workerThread() {
  const id = workerData.id;
  const mutex = Mutex.from(workerData.mutex);
  const arr = new Int32Array(workerData.data);

  let v = 0;
  mutex.lock();
  try {
    await delay(100);
    for (let i = 0; i < 1000; i++) {
      arr[0]++;
    }
    v = arr[0];
  } finally {
    mutex.unlock();
  }
  console.log(`Thread ${id} ended`, v);
}

if (isMainThread) {
  mainThread();
} else {
  workerThread();
}
