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
- AtomicLock

## how to use
`npm install @devteks/node-atomics --save` 

## Import:
import:
```javascript
const { WorkerPool, startWorker } = require('@devteks/node-atomics');
// OR
import { WorkerPool, startWorker } from '@devteks/node-atomics';
```

## Usage

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

### clone the repository and run examples in the examples directory
