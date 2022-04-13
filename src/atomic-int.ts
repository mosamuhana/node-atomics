import { lock, unlock, synchronize, DATA_INDEX } from './lock-utils';

export interface IEditor {
	get value(): number;
	set value(value: number);
}

abstract class AtomicInt {
	#name: string;
	#array: any;
	#editor: IEditor;

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

		if (typeof input === 'number') {
			Atomics.store(this.#array, DATA_INDEX, input);
		}

		this.#editor = Object.defineProperty({} as IEditor, 'value', {
			get: (): number => this.#array[DATA_INDEX],
			set: (value: number) => this.#array[DATA_INDEX] = value,
		});
	}

	get [Symbol.toStringTag]() { return this.name; }

	get name() { return this.#name; }
	get buffer() { return this.#array.buffer as SharedArrayBuffer; }

	/**
	 * Lock free value editor
	 */
	get $(): IEditor { return this.#editor; }

	get value(): number {
		return this.#synchronize(() => this.#array[DATA_INDEX]);
	}

	set value(val: number) {
		this.#synchronize(() => this.#array[DATA_INDEX] = val);
	}

	increment(): number {
		return this.#synchronize(() => ++this.#array[DATA_INDEX]);
	}

	decrement(): number {
		return this.#synchronize(() => --this.#array[DATA_INDEX]);
	}

	add(value: number): number {
		return this.#synchronize<number>(() => (this.#array[DATA_INDEX] += value, this.#array[DATA_INDEX]));
	}

	sub(value: number): number {
		return this.#synchronize<number>(() => (this.#array[DATA_INDEX] -= value, this.#array[DATA_INDEX]));
	}

	synchronize<T>(fn: (editor: IEditor) => T): T;
	synchronize<T>(fn: (editor: IEditor) => Promise<T>): Promise<T>;
	synchronize(fn: (editor: IEditor) => any) {
		return synchronize(this.#array, () => fn(this.#editor));
	}

	lock(): void {
		lock(this.#array);
	}

	unlock(): void {
		unlock(this.#array);
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

export class AtomicInt8 extends AtomicInt {
	static get BYTE_SIZE() { return 1; }
	static get UNSIGNED() { return false; }
	static get MIN() { return -128; }
	static get MAX() { return 127; }

	constructor(input?: Int8Array | SharedArrayBuffer | number) {
		super(Int8Array, input);
	}
}

export class AtomicInt16 extends AtomicInt {
	static get BYTE_SIZE() { return 2; }
	static get UNSIGNED() { return false; }
	static get MIN() { return -32768; }
	static get MAX() { return 32767; }

	constructor(input?: Int16Array | SharedArrayBuffer | number) {
		super(Int16Array, input);
	}
}

export class AtomicInt32 extends AtomicInt {
	static get BYTE_SIZE() { return 4; }
	static get UNSIGNED() { return false; }
	static get MIN() { return -2147483648; }
	static get MAX() { return 2147483647; }

	constructor(input?: Int32Array | SharedArrayBuffer | number) {
		super(Int32Array, input);
	}
}

export class AtomicUint8 extends AtomicInt {
	static get BYTE_SIZE() { return 1; }
	static get UNSIGNED() { return true; }
	static get MIN() { return 0; }
	static get MAX() { return 255; }

	constructor(input?: Uint8Array | SharedArrayBuffer | number) {
		super(Uint8Array, input);
	}
}

export class AtomicUint16 extends AtomicInt {
	static get BYTE_SIZE() { return 2; }
	static get UNSIGNED() { return true; }
	static get MIN() { return 0; }
	static get MAX() { return 65535; }

	constructor(input?: Uint16Array | SharedArrayBuffer | number) {
		super(Uint16Array, input);
	}
}

export class AtomicUint32 extends AtomicInt {
	static get BYTE_SIZE() { return 4; }
	static get UNSIGNED() { return true; }
	static get MIN() { return 0; }
	static get MAX() { return 4294967295; }

	constructor(input?: Uint32Array | SharedArrayBuffer | number) {
		super(Uint32Array, input);
	}
}
