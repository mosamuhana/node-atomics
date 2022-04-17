# @devteks/node-atomics

Node.js Thread safe tools
synchronized across worker threads

## Classes included
- AtomicInt8
- AtomicInt16
- AtomicInt32
- AtomicUint8
- AtomicUint16
- AtomicUint32
- AtomicBigInt64
- AtomicBigUint64
- AtomicBool
- Mutex
- Semaphore
- WaitGroup

## how to use
`npm install @devteks/node-atomics --save`

## Import:
import:
```javascript
const { AtomicInt32, Mutex } = require('@devteks/node-atomics');
// OR
import { AtomicInt32, Mutex } from '@devteks/node-atomics';
```

## Usage

All types has two methods
- `.synchronize()`: for not async function
- `.asynchronize()`: for async function

### Using Atomic Integers

```javascript
const { isMainThread, workerData, threadId, Worker } = require('worker_threads');
const { AtomicInt32 } = require('@devteks/node-atomics');

if (isMainThread) {
  const int = new AtomicInt32();
  Array(5).fill(null).map(() => new Worker(__filename, { workerData: { buffer: int.buffer } }));
  process.on('exit', () => {
    console.log(int.value);
  });
} else {
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

```

### Using `Mutex` with .synchronize()

```javascript
const { isMainThread, workerData, threadId, Worker } = require('worker_threads');
const { Mutex } = require('@devteks/node-atomics');

if (isMainThread) {
  const mutex = new Mutex();
  const buffer = new SharedArrayBuffer(4);
  const arr = new Int32Array(buffer);
  Array(5).fill(null).map(() => new Worker(__filename, { workerData: { buffer: buffer, mutex: mutex.buffer } }));
  process.on('exit', () => {
    console.log(arr[0]);
  });
} else {
  const mutex = Mutex.from(workerData.mutex);
  const arr = new Int32Array(workerData.buffer);
  console.log(`Thread ${threadId} started`, arr[0]);
	// or use mutex.lock() and mutex.unlock()
  const v = mutex.synchronize(() => {
    for (let i = 0; i < 1000; i++) {
      arr[0]++;
    }
    return arr[0];
  });
  console.log(`Thread ${threadId} ended`, v);
}
```

### Using `Mutex` with .asynchronize()

```javascript
const { isMainThread, workerData, threadId, Worker } = require('worker_threads');
const { setTimeout } = require('timers/promises');
const { Mutex } = require('@devteks/node-atomics');

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
  const mutex = Mutex.from(workerData.mutex);
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
    mutex.lock();
    await setTimeout(100);
    for (let i = 0; i < 1000; i++) {
      arr[0]++;
    }
    const v = arr[0];
    mutex.unlock();
    console.log(`Thread ${id} ended`, v);
  };

  await run();
}

if (isMainThread) {
  mainThread();
} else {
  workerThread();
}
```


### Using `WaitGroup`

in main.js

```javascript
const { join } = require('path');
const { Worker } = require('worker_threads');
const { WaitGroup, Mutex } = require('@devteks/node-atomics');

async function main() {
	const workers = [];
	const sab = new SharedArrayBuffer(4);
	const count = new Int32Array(sab);
	const mutex = new Mutex();
	const size = 5;
	const waitGroup = new WaitGroup(size);

	for (let i = 0; i < size; i++) {
		const worker = new Worker(join(__dirname, './worker.js'), {
			stdout: true,
			workerData: {
				waitGroupBuffer: waitGroup.buffer,
				mutexBuffer: mutex.buffer,
				sab: sab
			}
		});
		workers.push(worker);
	}

	waitGroup.wait();
	console.log('Result:', count[0]);
}

main().then(() => console.log('Done'));
```
in `worker.js`

```javascript
const { workerData, threadId } = require("worker_threads");
const delay = require('timers/promises').setTimeout;
const { WaitGroup, Mutex } = require("../../");

async function main() {
	const waitGroup = WaitGroup.from(workerData.waitGroupBuffer);
	const mutex = Mutex.from(workerData.mutexBuffer);
	const count = new Int32Array(workerData.sab);

	mutex.lock();
	Array(1000).fill(null).forEach(() => count[0]++);
	mutex.unlock();

	await delay(1000);
	waitGroup.done();
}

main();
```

### clone the repository and run examples in the examples directory
