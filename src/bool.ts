import {
	lock,
	unlock,
	synchronize,
	asynchronize,
	createBoolEditor,
	bool2int,
} from './utils';
import { IBoolEditor } from './types';

export class AtomicBool {
	#array: Int32Array;
	#editor: IBoolEditor;

	constructor();
	constructor(inital: boolean);
	constructor(array: Int8Array);
	constructor(buffer: SharedArrayBuffer);
	constructor(input?: any) {
		if (input == null) {
			this.#array = new Int32Array(new SharedArrayBuffer(8));
		} else if (input instanceof SharedArrayBuffer) {
			if (input.byteLength != 8) {
				throw new Error(`AtomicBool buffer must be 8 bytes.`);
			}
			this.#array = new Int32Array(input);
		} else if (input instanceof Int32Array) {
			if (input.length != 2) {
				throw new Error(`AtomicBool array must be 2 items.`);
			}
			this.#array = input;
		} else if (typeof input === 'boolean') {
			this.#array = new Int32Array(new SharedArrayBuffer(8));
			this.#array[0] = bool2int(input);
		} else {
			throw new Error(`Invalid parameter type.`)
		}

		this.#editor = createBoolEditor(this.#array);
	}

	get [Symbol.toStringTag]() { return this.name; }

	get name() { return 'AtomicBool'; }
	get buffer() { return this.#array.buffer as SharedArrayBuffer; }

	/**
	 * Lock free value editor
	 */
	get $() { return this.#editor; }

	get value(): boolean {
		return synchronize(this.#array, () => this.#editor.value);
	}

	set value(v: boolean) {
		synchronize(this.#array, () => this.#editor.value = v);
	}

	not() {
		return synchronize(this.#array, () => this.#editor.not());
	}

	synchronize<T>(fn: (editor: IBoolEditor) => T) {
		return synchronize<T>(this.#array, () => fn(this.#editor));
	}

	async asynchronize<T>(fn: (editor: IBoolEditor) => Promise<T>) {
		return await asynchronize<T>(this.#array, () => fn(this.#editor));
	}

	lock(): void {
		lock(this.#array);
	}

	unlock(): void {
		unlock(this.#array);
	}
}
