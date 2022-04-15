# @devteks/node-atomics

Thread safe Integer
synchronized across worker threads

- AtomicInt8
- AtomicInt16
- AtomicInt32
- AtomicUint8
- AtomicUint16
- AtomicUint32
- AtomicBigInt64
- AtomicBigUint64
- AtomicBool
- AtomicLock
- Semaphore
- Mutex

## how to use
`npm install @devteks/node-atomics --save` 

## Import:
import:
```javascript
const { AtomicInt32, AtomicLock } = require('@devteks/node-atomics');
// OR
import { AtomicInt32, AtomicLock } from '@devteks/node-atomics';
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
  const int = new AtomicInt32(workerData.buffer);
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

### Using Atomic Lock

```javascript
const { isMainThread, workerData, threadId, Worker } = require('worker_threads');
const { AtomicLock } = require('@devteks/node-atomics');

if (isMainThread) {
  const lock = new AtomicLock();
  const buffer = new SharedArrayBuffer(4);
  const arr = new Int32Array(buffer);
  Array(5).fill(null).map(() => new Worker(__filename, { workerData: { buffer: buffer, lock: lock.buffer } }));
  process.on('exit', () => {
    console.log(arr[0]);
  });
} else {
  const lock = new AtomicLock(workerData.lock);
  const arr = new Int32Array(workerData.buffer);
  console.log(`Thread ${threadId} started`, arr[0]);
  const v = lock.synchronize(() => {
    for (let i = 0; i < 1000; i++) {
      arr[0]++;
    }
    return arr[0];
  });
  console.log(`Thread ${threadId} ended`, v);
}
```

### Using Mutex with .asynchronize()

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
```

### clone the repository and run examples in the examples directory
