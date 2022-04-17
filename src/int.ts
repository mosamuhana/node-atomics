import { lock, unlock, synchronize, asynchronize, createEditor, DATA_INDEX } from './utils';
import { IEditor } from './types';

abstract class AtomicInt {
	#name: string;
	#array: any;
	#editor: IEditor<number>;

	constructor(Type: any, input: any) {
		const size: number = Type.BYTES_PER_ELEMENT * 2;
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
		} else if (typeof input === 'number') {
			if (isNaN(input) || !Number.isInteger(input)) {
				throw new Error(`${this.#name} initial value must be an integer.`);
			}
			this.#array = new Type(new SharedArrayBuffer(size));
			this.#array[0] = input;
		} else {
			throw new Error(`Invalid parameter type.`)
		}

		this.#editor = createEditor(this.#array);
	}

	get [Symbol.toStringTag]() { return this.name; }

	get name() { return this.#name; }
	get buffer() { return this.#array.buffer as SharedArrayBuffer; }

	/**
	 * Lock free value editor
	 */
	get $() { return this.#editor; }

	get value(): number {
		return synchronize(this.#array, () => this.#array[DATA_INDEX]);
	}

	set value(val: number) {
		synchronize(this.#array, () => this.#array[DATA_INDEX] = val);
	}

	increment(): number {
		return synchronize(this.#array, () => ++this.#array[DATA_INDEX]);
	}

	decrement(): number {
		return synchronize(this.#array, () => --this.#array[DATA_INDEX]);
	}

	add(value: number): number {
		return synchronize(this.#array, () => (this.#array[DATA_INDEX] += value, this.#array[DATA_INDEX]));
	}

	sub(value: number): number {
		return synchronize(this.#array, () => (this.#array[DATA_INDEX] -= value, this.#array[DATA_INDEX]));
	}

	synchronize<T>(fn: (editor: IEditor<number>) => T): T {
		return synchronize<T>(this.#array, () => fn(this.#editor));
	}

	lock(): void {
		lock(this.#array);
	}

	unlock(): void {
		unlock(this.#array);
	}

	async asynchronize<T>(fn: (editor: IEditor<number>) => Promise<T>): Promise<T> {
		return await asynchronize(this.#array, () => fn(this.#editor));
	}
}

export class AtomicInt8 extends AtomicInt {
	static get BYTE_SIZE() { return 1; }
	static get UNSIGNED() { return false; }
	static get MIN() { return -128; }
	static get MAX() { return 127; }

  static from(buffer: SharedArrayBuffer): AtomicInt8;
  static from(array: Int8Array): AtomicInt8;
  static from(input: any): AtomicInt8 {
    return new AtomicInt8(input);
  }

	constructor();
	constructor(array: Int8Array);
	constructor(buffer: SharedArrayBuffer);
	constructor(initial: number);
	constructor(input?: any) {
		super(Int8Array, input);
	}
}

export class AtomicInt16 extends AtomicInt {
	static get BYTE_SIZE() { return 2; }
	static get UNSIGNED() { return false; }
	static get MIN() { return -32768; }
	static get MAX() { return 32767; }

	static from(buffer: SharedArrayBuffer): AtomicInt16;
  static from(array: Int16Array): AtomicInt16;
  static from(input: any): AtomicInt16 {
    return new AtomicInt16(input);
  }

	constructor();
	constructor(array: Int16Array);
	constructor(buffer: SharedArrayBuffer);
	constructor(initial: number);
	constructor(input?: any) {
		super(Int16Array, input);
	}
}

export class AtomicInt32 extends AtomicInt {
	static get BYTE_SIZE() { return 4; }
	static get UNSIGNED() { return false; }
	static get MIN() { return -2147483648; }
	static get MAX() { return 2147483647; }

	static from(buffer: SharedArrayBuffer): AtomicInt32;
  static from(array: Int32Array): AtomicInt32;
  static from(input: any): AtomicInt32 {
    return new AtomicInt32(input);
  }

	constructor();
	constructor(array: Int32Array);
	constructor(buffer: SharedArrayBuffer);
	constructor(initial: number);
	constructor(input?: any) {
		super(Int32Array, input);
	}
}

export class AtomicUint8 extends AtomicInt {
	static get BYTE_SIZE() { return 1; }
	static get UNSIGNED() { return true; }
	static get MIN() { return 0; }
	static get MAX() { return 255; }

	static from(buffer: SharedArrayBuffer): AtomicUint8;
  static from(array: Uint8Array): AtomicUint8;
  static from(input: any): AtomicUint8 {
    return new AtomicUint8(input);
  }

	constructor();
	constructor(array: Uint8Array);
	constructor(buffer: SharedArrayBuffer);
	constructor(initial: number);
	constructor(input?: any) {
		super(Uint8Array, input);
	}
}

export class AtomicUint16 extends AtomicInt {
	static get BYTE_SIZE() { return 2; }
	static get UNSIGNED() { return true; }
	static get MIN() { return 0; }
	static get MAX() { return 65535; }

	static from(buffer: SharedArrayBuffer): AtomicUint16;
  static from(array: Uint16Array): AtomicUint16;
  static from(input: any): AtomicUint16 {
    return new AtomicUint16(input);
  }

	constructor();
	constructor(array: Uint16Array);
	constructor(buffer: SharedArrayBuffer);
	constructor(initial: number);
	constructor(input?: any) {
		super(Uint16Array, input);
	}
}

export class AtomicUint32 extends AtomicInt {
	static get BYTE_SIZE() { return 4; }
	static get UNSIGNED() { return true; }
	static get MIN() { return 0; }
	static get MAX() { return 4294967295; }

	static from(buffer: SharedArrayBuffer): AtomicUint32;
  static from(array: Uint32Array): AtomicUint32;
  static from(input: any): AtomicUint32 {
    return new AtomicUint32(input);
  }

	constructor();
	constructor(array: Uint32Array);
	constructor(buffer: SharedArrayBuffer);
	constructor(initial: number);
	constructor(input?: any) {
		super(Uint32Array, input);
	}
}
