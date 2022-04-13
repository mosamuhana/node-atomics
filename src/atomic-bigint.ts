import { lock64, unlock64, synchronize64, DATA_INDEX } from './lock-utils';

export interface IEditor64 {
	get value(): bigint;
	set value(value: bigint);
}

abstract class AtomicBigInt {
	#name: string;
	#array: any;
	#editor: IEditor64;

	constructor(Type: any, input: any) {
		if (input instanceof Type) {
			if (!(input.buffer instanceof SharedArrayBuffer)) {
				throw new Error(`${Type.name} buffer not SharedArrayBuffer`);
			}
			this.#array = input;
		} else if (input instanceof SharedArrayBuffer) {
			this.#array = new Type(input);
		} else {
			this.#array = new Type(new SharedArrayBuffer(Type.BYTES_PER_ELEMENT * 2));
		}

		this.#name = 'Atomic' + Type.name.replace('Array', '');

		if (typeof input === 'bigint') {
			Atomics.store(this.#array, DATA_INDEX, input);
		} else if (typeof input === 'number') {
			Atomics.store(this.#array, DATA_INDEX, BigInt(input));
		}

		this.#editor = Object.defineProperty({} as IEditor64, 'value', {
			get: (): bigint => this.#array[DATA_INDEX],
			set: (value: bigint) => this.#array[DATA_INDEX] = value,
		});
	}

	get [Symbol.toStringTag]() { return this.#name; }

	get name() { return this.#name; }
	get buffer() { return this.#array.buffer as SharedArrayBuffer; }
	get $(): IEditor64 { return this.#editor; }

	get value(): bigint {
		return this.#synchronize(() => this.#array[DATA_INDEX]);
	}

	set value(val: bigint) {
		this.#synchronize(() => this.#array[DATA_INDEX] = val);
	}

	increment() {
		return this.#synchronize(() => ++this.#array[DATA_INDEX]);
	}

	decrement() {
		return this.#synchronize(() => --this.#array[DATA_INDEX]);
	}

	add(value: bigint): bigint {
		return this.#synchronize<bigint>(() => (this.#array[DATA_INDEX] += value, this.#array[DATA_INDEX]));
	}

	sub(value: bigint): bigint {
		return this.#synchronize<bigint>(() => (this.#array[DATA_INDEX] -= value, this.#array[DATA_INDEX]));
	}

	synchronize<T>(fn: (editor: IEditor64) => T): T;
	synchronize<T>(fn: (editor: IEditor64) => Promise<T>): Promise<T>;
	synchronize(fn: (editor: IEditor64) => any) {
		return synchronize64(this.#array, () => fn(this.#editor));
	}

	lock(): void {
		lock64(this.#array);
	}

	unlock(): void {
		unlock64(this.#array);
	}

	#synchronize<T>(fn: () => T) {
		try {
			this.lock();
			return fn();
		} finally {
			this.unlock();
		}
	}
}

export class AtomicBigInt64 extends AtomicBigInt {
	static get BYTE_SIZE() { return 8; }
	static get UNSIGNED() { return false; }
	static get MIN() { return -(2n ** 63n); }
	static get MAX() { return 2n ** 63n - 1n; }

	constructor(input?: BigInt64Array | SharedArrayBuffer | number) {
		super(BigInt64Array, input);
	}
}

export class AtomicBigUint64 extends AtomicBigInt {
	static get BYTE_SIZE() { return 8; }
	static get UNSIGNED() { return true; }
	static get MIN() { return 0n; }
	static get MAX() { return 2n ** 64n - 1n; }

	constructor(input?: BigUint64Array | SharedArrayBuffer | number) {
		super(BigUint64Array, input);
	}
}
