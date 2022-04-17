export class WaitGroup {
  static from(buffer: SharedArrayBuffer): WaitGroup;
  static from(buffer: Int32Array): WaitGroup;
  static from(buffer: any): WaitGroup {
    return new WaitGroup(buffer);
  }

  #array: Int32Array;

	constructor();
	constructor(initial: number);
	constructor(buffer: SharedArrayBuffer);
	constructor(array: Int32Array);
  constructor(input?: any) {
		if (input == null) {
			this.#array = new Int32Array(new SharedArrayBuffer(4));
		} else if (input instanceof SharedArrayBuffer) {
			if (input.byteLength != 4) {
				throw new Error("WaitGroup buffer must be 4 bytes.");
			}
			this.#array = new Int32Array(input);
		} else if (input instanceof Int32Array) {
			if (input.length != 1) {
				throw new Error("WaitGroup buffer must be 4 bytes.");
			}
			this.#array = input;
		} else if (typeof input === 'number') {
			if (!Number.isInteger(input) || input <= 0) {
				throw new Error("WaitGroup initial value must be an integer greater than zero.");
			}
			const array = new Int32Array(new SharedArrayBuffer(4));
			array[0] = input;
			this.#array = array;
		} else {
			throw new Error(`Invalid type`)
		}
	}

  get buffer() {
    return this.#array.buffer as SharedArrayBuffer;
  }

  add(n: number = 1) {
		const t = typeof n;
		if (t !== 'number' || !Number.isInteger(n) || n < 1) {
			throw new Error('WaitGroup must add integer >= 1')
		}
    this.#add(n);
  }

  done() {
    this.#add(-1);
  }

  wait() {
    while (true) {
      let count = Atomics.load(this.#array, 0);
      if (count == 0) return;
      if (Atomics.wait(this.#array, 0, count) == "ok") return;
    }
  }

	#add(n: number) {
		const current = n + Atomics.add(this.#array, 0, n);
		if (current < 0) {
			throw new Error("WaitGroup is in inconsistent state: negative count.");
		}
		if (current > 0) return;
		Atomics.notify(this.#array, 0);
	}
}
