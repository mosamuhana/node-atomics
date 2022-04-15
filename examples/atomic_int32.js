const { isMainThread, workerData, threadId, Worker } = require('worker_threads');
const { setTimeout } = require('timers/promises');
const { AtomicInt32 } = require('../');

async function mainThread() {
  console.time('main');
  const int = new AtomicInt32();

  const runTask = (id) => {
    const worker = new Worker(__filename, { workerData: { data: int.buffer, id } });
    return new Promise((resolve, reject) => {
      worker.on('exit', () => {
        console.log(`Thread ${id} exited`);
        resolve();
      });
      worker.on('error', err => reject(err));
    });
  }

  await Promise.all( Array(5).fill(null).map((_, id) => runTask(id)) );

  console.log('RESULT:', int.value);
  console.timeEnd('main');
}

async function workerThread() {
  const id = workerData.id;
  const int = new AtomicInt32(workerData.data);
  //console.log(`Thread ${id} started`, arr[0]);
  const v = await int.asynchronize(async (e) => {
    await setTimeout(100);
    for (let i = 0; i < 1000; i++) {
      e.value++;
    }
    //console.log(`${id}, ${c}`)
    return e.value;
  });
  console.log(`Thread ${id} ended`, v);
}

if (isMainThread) {
  mainThread();
} else {
  workerThread();
}
