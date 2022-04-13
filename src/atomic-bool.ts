import { lock, unlock, synchronize, DATA_INDEX } from './lock-utils';

export interface IBoolEditor {
	get value(): boolean;
	set value(value: boolean);
	not(): boolean;
}

export class AtomicBool {
	#array: Int8Array;
	#editor: IBoolEditor;

	constructor(input?: Int8Array | SharedArrayBuffer | boolean) {
		if (input == null) {
			this.#array = new Int8Array(new SharedArrayBuffer(2));
		} else {
			if (input instanceof Int8Array) {
				if (!(input.buffer instanceof SharedArrayBuffer)) {
					throw new Error(`buffer not SharedArrayBuffer`);
				}
				this.#array = input;
			} else if (input instanceof SharedArrayBuffer) {
				this.#array = new Int8Array(input);
			} else {
				if (typeof input === 'boolean') {
					this.#array = new Int8Array(new SharedArrayBuffer(2));
					Atomics.store(this.#array, DATA_INDEX, input ? 1 : 0);
				} else {
					throw new Error(`input must be Int8Array or SharedArrayBuffer or boolean`);
				}
			}
		}

		this.#editor = {} as IBoolEditor;
		Object.defineProperty(this.#editor, 'value', {
			get: (): boolean => this.#getValue(),
			set: (value: boolean) => this.#setValue(value),
		});
		Object.defineProperty(this.#editor, 'not', {
			value: (): boolean => this.#setValue(!this.#getValue()),
		});
	}

	get [Symbol.toStringTag]() { return this.name; }

	get name() { return 'AtomicBool'; }
	get buffer() { return this.#array.buffer as SharedArrayBuffer; }

	/**
	 * Lock free value editor
	 */
	get $(): IBoolEditor { return this.#editor; }

	#getValue(): boolean { return this.#array[DATA_INDEX] === 1; }
	#setValue(v: boolean) {
		v = !!v;
		this.#array[DATA_INDEX] = v ? 1 : 0;
		return v;
	}

	get value(): boolean {
		return this.#synchronize(() => this.#getValue());
	}

	set value(val: boolean) {
		this.#synchronize(() => this.#setValue(val));
	}

	not() {
		return this.#synchronize(() => this.#setValue(!this.#getValue()));
	}

	synchronize<T>(fn: (editor: IBoolEditor) => T): T;
	synchronize<T>(fn: (editor: IBoolEditor) => Promise<T>): Promise<T>;
	synchronize(fn: (editor: IBoolEditor) => any) {
		return synchronize(this.#array, () => fn(this.#editor));
	}

	lock(): void {
		lock(this.#array);
	}

	unlock(): void {
		unlock(this.#array);
	}

	#synchronize(fn: () => boolean): boolean {
		try {
			this.lock();
			return fn();
		} finally {
			this.unlock();
		}
	}
}
