import { LOCKED, UNLOCKED } from './utils';

export class Semaphore {
  /**
   * Create Semaphore instance from existing SharedArrayBuffer.
   * @param {SharedArrayBuffer} buffer Constructed SharedArrayBuffer.
   * @param {number} count The number which allowed to enter critical section.
   * @returns {Semaphore}
   */
  static from(buffer: SharedArrayBuffer): Semaphore;
  static from(buffer: Int32Array): Semaphore;
  static from(buffer: any): Semaphore {
    return new Semaphore(buffer);
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
	constructor(count: number);
	constructor(buffer: SharedArrayBuffer);
	constructor(array: Int32Array);
  constructor(input: any) {
		if (typeof input === 'number') {
			if (!Number.isInteger(input) || input <= 0) {
				throw new Error("WaitGroup initial value must be an integer greater than zero.");
			}
			this.#array = new Int32Array(new SharedArrayBuffer(input * 4));
		} else {
      if (input instanceof Int32Array) {
        if (!(input.buffer instanceof SharedArrayBuffer)) {
          throw new Error('buffer must be Int32Array with Int32Array.buffer as SharedArrayBuffer');
        }
        this.#array = input;
      } else if (input instanceof SharedArrayBuffer) {
        if ((input.byteLength % 4) !== 0) {
          throw new Error('buffer length must be multiple of 4');
        }
        this.#array = new Int32Array(input);
      } else {
        throw new Error('buffer must be SharedArrayBuffer or Int32Array');
      }
		}

		this.#count = this.#array.length;
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
