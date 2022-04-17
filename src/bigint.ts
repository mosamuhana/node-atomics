import { lock64, unlock64, synchronize64, asynchronize64, createEditor, DATA_INDEX } from './utils';
import { IEditor } from './types';

abstract class AtomicBigInt {
	#name: string;
	#array: any;
	#editor: IEditor<bigint>;

	constructor(Type: any, input: any) {
		const size: number = 16;
		this.#name = 'Atomic' + Type.name.replace('Array', '');

		if (input == null) {
			this.#array = new Type(new SharedArrayBuffer(size));
		} else if (input instanceof SharedArrayBuffer) {
			if (input.byteLength != size) {
				throw new Error(`${this.#name} buffer must be ${size} bytes.`);
			}
			this.#array = new Type(input);
		} else if (input instanceof Type) {
			if (input.length != 2) {
				throw new Error(`${this.#name} array must be 2 items.`);
			}
			this.#array = input;
		} else if (typeof input === 'bigint') {
			this.#array = new Type(new SharedArrayBuffer(size));
			this.#array[DATA_INDEX] = input;
		} else if (typeof input === 'number') {
			if (isNaN(input) || !Number.isInteger(input)) {
				throw new Error(`${this.#name} initial value must be an integer.`);
			}
			this.#array = new Type(new SharedArrayBuffer(size));
			this.#array[DATA_INDEX] = BigInt(input);
		} else {
			throw new Error(`Invalid parameter type.`)
		}

		this.#editor = createEditor(this.#array);
	}

	get [Symbol.toStringTag]() { return this.#name; }

	get name() { return this.#name; }
	get buffer() { return this.#array.buffer as SharedArrayBuffer; }
	get $() { return this.#editor; }

	get value(): bigint {
		return synchronize64(this.#array, () => this.#array[DATA_INDEX]);
	}

	set value(val: bigint) {
		synchronize64(this.#array, () => this.#array[DATA_INDEX] = val);
	}

	increment() {
		return synchronize64(this.#array, () => ++this.#array[DATA_INDEX]);
	}

	decrement() {
		return synchronize64(this.#array, () => --this.#array[DATA_INDEX]);
	}

	add(value: bigint): bigint {
		return synchronize64(this.#array, () => (this.#array[DATA_INDEX] += value, this.#array[DATA_INDEX]));
	}

	sub(value: bigint): bigint {
		return synchronize64(this.#array, () => (this.#array[DATA_INDEX] -= value, this.#array[DATA_INDEX]));
	}

	synchronize<T>(fn: (editor: IEditor<bigint>) => T) {
		return synchronize64(this.#array, () => fn(this.#editor));
	}

	async asynchronize<T>(fn: (editor: IEditor<bigint>) => Promise<T>) {
		return await asynchronize64(this.#array, () => fn(this.#editor));
	}

	lock(): void {
		lock64(this.#array);
	}

	unlock(): void {
		unlock64(this.#array);
	}
}

export class AtomicBigInt64 extends AtomicBigInt {
	static get BYTE_SIZE() { return 8; }
	static get UNSIGNED() { return false; }
	static get MIN() { return -(2n ** 63n); }
	static get MAX() { return 2n ** 63n - 1n; }

	static from(buffer: SharedArrayBuffer): AtomicBigInt64;
  static from(array: BigInt64Array): AtomicBigInt64;
  static from(input: any): AtomicBigInt64 {
    return new AtomicBigInt64(input);
  }

	constructor();
	constructor(array: BigInt64Array);
	constructor(buffer: SharedArrayBuffer);
	constructor(initial: number);
	constructor(initial: bigint);
	constructor(input?: any) {
		super(BigInt64Array, input);
	}
}

export class AtomicBigUint64 extends AtomicBigInt {
	static get BYTE_SIZE() { return 8; }
	static get UNSIGNED() { return true; }
	static get MIN() { return 0n; }
	static get MAX() { return 2n ** 64n - 1n; }

	static from(buffer: SharedArrayBuffer): AtomicBigUint64;
  static from(array: BigUint64Array): AtomicBigUint64;
  static from(input: any): AtomicBigUint64 {
    return new AtomicBigUint64(input);
  }

	constructor();
	constructor(array: BigUint64Array);
	constructor(buffer: SharedArrayBuffer);
	constructor(initial: number);
	constructor(initial: bigint);
	constructor(input?: any) {
		super(BigUint64Array, input);
	}
}
