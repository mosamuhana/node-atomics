import { LOCKED, UNLOCKED } from './lock-utils';

/**
 * Semaaphore implementation class.
 */
export class Semaphore {
  /**
   * Create Semaphore instance from existing SharedArrayBuffer.
   * @param {SharedArrayBuffer} buffer Constructed SharedArrayBuffer.
   * @param {number} count The number which allowed to enter critical section.
   * @returns {Semaphore}
   */
  static from(buffer: SharedArrayBuffer | Int32Array): Semaphore {
    let count = 0;
    if (buffer instanceof Int32Array) {
      count = buffer.length;
    } else if (buffer instanceof SharedArrayBuffer) {
      if (buffer.byteLength % 4 !== 0) {
        throw new Error('buffer length must be multiple of 4');
      }
      count = buffer.byteLength / 4;
    } else {
      throw new Error('buffer must be SharedArrayBuffer or Int32Array');
    }
    if (count < 1) {
      throw new Error('buffer length must be greater than 0');
    }
    return new Semaphore(count, buffer);
  }

  #count: number;
  #current?: number;
  #array: Int32Array;

  /**
   * construct Semaphore.
   * If `buffer` is passed, this semaphore constructed from that SharedArrayBuffer or Int32Array.
   * @param {number} count Number of allowed to enter critical section.
   * @param {SharedArrayBuffer} buffer Optional SharedArrayBuffer or Int32Array.
   */
  constructor(count: number, buffer?: SharedArrayBuffer | Int32Array) {
    //const buf = buffer || new SharedArrayBuffer(count % 4 !== 0 ? count * 4 : count);
    if (buffer == null) {
      this.#array = new Int32Array(new SharedArrayBuffer(count * 4));
    } else {
      if (buffer instanceof Int32Array) {
        if (!(buffer.buffer instanceof SharedArrayBuffer)) {
          throw new Error('buffer must be Int32Array with Int32Array.buffer as SharedArrayBuffer');
        }
        if (buffer.length !== count) {
          throw new Error('buffer length is not equal to count');
        }
        this.#array = buffer;
      } else if (buffer instanceof SharedArrayBuffer) {
        if ((buffer.byteLength / 4) !== count) {
          throw new Error('buffer length is not equal to count');
        }
        this.#array = new Int32Array(buffer);
      } else {
        throw new Error('buffer must be SharedArrayBuffer or Int32Array');
      }
    }

    this.#count = count;
    this.#current = undefined;
  }

  /**
   * Return SharedArrayBuffer.
   * This method often used in main thread.
   * @returns {SharedArrayBuffer}
   * @example
   *
   * const worker = new Worker('...');
   * const semaphore = new Semaphore();
   * worker.postMessage({ shared: semaphore.buffer });
   */
  get buffer(): SharedArrayBuffer {
    return this.#array.buffer as SharedArrayBuffer;
  }

  /**
   * Release occupied section.
   */
  signal() {
    if (this.#current === undefined) return;
    const index = this.#current;
    this.#current = undefined;
    Atomics.store(this.#array, index, UNLOCKED);
  }

  acquire() {
    if (this.#current !== undefined) return;
    while (true) {
      for (let i = 0; i < this.#count; i++) {
        if (Atomics.compareExchange(this.#array, i, UNLOCKED, LOCKED) === UNLOCKED) {
          this.#current = i;
          return;
        }
      }
    }
  }

  synchronize<T>(fn: () => T): T {
    this.acquire();
    try {
      return fn();
    } finally {
      this.signal();
    }
  }

  async asynchronize<T>(fn: () => Promise<T>): Promise<T> {
    this.acquire();
    try {
      return await fn();
    } finally {
      this.signal();
    }
  }
}

export class Mutex extends Semaphore {
  constructor(buffer?: SharedArrayBuffer | Int32Array) {
    super(1, buffer);
  }

  static from(buffer: SharedArrayBuffer | Int32Array) {
    return new Mutex(buffer);
  }
}
