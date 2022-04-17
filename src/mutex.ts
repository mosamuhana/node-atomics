import { lock, unlock } from './utils';

export class Mutex {
	static from(buffer: SharedArrayBuffer): Mutex;
  static from(buffer: Int32Array): Mutex;
  static from(buffer: any): Mutex {
    return new Mutex(buffer);
  }

  #array: Int32Array;

  /**
   * Instantiate Mutex.
   * If buffer is provided, the mutex will use it as a backing array.
   * @param {SharedArrayBuffer} buffer Optional SharedArrayBuffer.
   */
  constructor();
  constructor(input: SharedArrayBuffer);
  constructor(input: Int32Array);
  constructor(input?: any) {
		if (input == null) {
			this.#array = new Int32Array(new SharedArrayBuffer(4));
		} else if (input instanceof SharedArrayBuffer) {
			if (input.byteLength != 4) {
				throw new Error("Mutex buffer must be 4 bytes.");
			}
			this.#array = new Int32Array(input);
		} else if (input instanceof Int32Array) {
			if (input.length != 1) {
				throw new Error("Mutex buffer must be 4 bytes.");
			}
			this.#array = input;
		} else {
			throw new Error(`Invalid parameter type`)
		}
  }

  get buffer() {
    return this.#array.buffer as SharedArrayBuffer;
  }

  lock() {
		lock(this.#array);
  }

  unlock() {
		unlock(this.#array);
  }

	synchronize<T>(fn: () => T): T {
		this.lock();
		try {
			return fn();
		} finally {
			this.unlock();
		}
	}

	async asynchronize<T>(fn: () => Promise<T>): Promise<T> {
		this.lock();
		try {
			return await fn();
		} finally {
			this.unlock();
		}
	}
}
