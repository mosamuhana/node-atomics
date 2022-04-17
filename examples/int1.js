const { isMainThread, workerData, threadId, Worker } = require('worker_threads');

const { AtomicInt32 } = require('../');

async function mainThread() {
	console.time('main');
  const int = new AtomicInt32();
  Array(5).fill(null).map(() => new Worker(__filename, { workerData: { buffer: int.buffer } }));
  process.on('exit', () => {
    console.log(int.value);
    console.timeEnd('main');
  });
}

async function workerThread() {
  const int = AtomicInt32.from(workerData.buffer);
  console.log(`Thread ${threadId} started`, int.value);
  const v = int.synchronize(e => {
    for (let i = 0; i < 1000; i++) {
      e.value++;
    }
    return e.value;
  });
  console.log(`Thread ${threadId} ended`, v);
}

if (isMainThread) {
	mainThread();
} else {
	workerThread();
}
