import { lock, unlock, synchronize } from './lock-utils';

export class AtomicLock {
	#array: Int32Array;

	constructor(array?: Int32Array | SharedArrayBuffer) {
		if (array == null) {
			this.#array = new Int32Array(new SharedArrayBuffer(4));
		} else {
			if (array instanceof SharedArrayBuffer) {
				if (array.byteLength !== 4) {
					throw new Error('SharedArrayBuffer must be 4 bytes long');
				}
				this.#array = new Int32Array(array);
			} else if (array instanceof Int32Array) {
				this.#array = array;
			} else {
				throw new Error('Invalid lock buffer');
			}
		}
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

	synchronize<T>(fn: () => T): T;
	synchronize<T>(fn: () => Promise<T>): Promise<T>;
	synchronize(fn: () => any) {
		return synchronize(this.#array, fn);
	}
}
