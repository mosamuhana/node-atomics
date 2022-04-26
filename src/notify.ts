export class NotifyDone {
	#array: Int32Array;
	#done: boolean = false;

	constructor(buffer: SharedArrayBuffer) {
		if (buffer == null || !(buffer instanceof SharedArrayBuffer) || buffer.byteLength != 4) {
			throw new Error('NotifyDone: buffer must be SharedArrayBuffer of byteLength = 4');
		}
		this.#array = new Int32Array(buffer);
	}

	async done() {
		if (this.#done) return;
		this.#done = true;
		Atomics.store(this.#array, 0, 1);
		Atomics.notify(this.#array, 0);
	}
}

export class NotifyWait {
	#array = new Int32Array(new SharedArrayBuffer(4));
	#done: boolean = false;

	get buffer() {
		return this.#array.buffer as SharedArrayBuffer;
	}

	async wait() {
		if (this.#done) return;
		this.#done = true;
		Atomics.wait(this.#array, 0, 0);
	}
}
