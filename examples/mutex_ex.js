const { isMainThread, workerData, threadId, Worker } = require('worker_threads');
const { setTimeout } = require('timers/promises');

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

  //await setTimeout(1000);
  console.log('RESULT:', arr[0]);
  console.timeEnd('main');
}

async function workerThread() {
  const id = workerData.id;
  const mutex = new Mutex(workerData.mutex);
  const arr = new Int32Array(workerData.data);
  const run = async () => {
    const v = await mutex.asynchronize(async () => {
      await setTimeout(100);
      for (let i = 0; i < 1000; i++) {
        arr[0]++;
      }
      return arr[0];
    });
    console.log(`Thread ${id} ended`, v);
  };
  const run2 = async () => {
    mutex.acquire();
    await setTimeout(100);
    for (let i = 0; i < 1000; i++) {
      arr[0]++;
    }
    const v = arr[0];
    mutex.signal();
    console.log(`Thread ${id} ended`, v);
  };
  
  await run();
}

if (isMainThread) {
  mainThread();
} else {
  workerThread();
}
