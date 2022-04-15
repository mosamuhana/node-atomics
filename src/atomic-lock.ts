import { lock, unlock } from './lock-utils';
import { toTypedArray } from './utils';

export class AtomicLock {
	#array: Int32Array;

	constructor(array?: Int32Array | SharedArrayBuffer) {
		this.#array = toTypedArray<Int32Array>(Int32Array, array) ?? new Int32Array(new SharedArrayBuffer(4));
	}

	get buffer() {
		return this.#array.buffer as SharedArrayBuffer;
	}

	lock(): void {
		lock(this.#array);
	}

	unlock(): void {
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
