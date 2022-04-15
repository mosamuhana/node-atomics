/**
* @author Mosa Muhana <mosamuhana@gmail.com>
* https://github.com/mosamuhana
* See LICENSE file in root directory for full license.
*/
'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const UNLOCKED64 = 0n;
const LOCKED64 = 1n;
const UNLOCKED = 0;
const LOCKED = 1;
const DATA_INDEX = 1;
function lock(arr) {
    while (true) {
        if (Atomics.compareExchange(arr, 0, UNLOCKED, LOCKED) !== LOCKED)
            return;
        Atomics.wait(arr, 0, LOCKED);
    }
}
function unlock(arr) {
    Atomics.store(arr, 0, UNLOCKED);
    Atomics.notify(arr, 0, 1);
}
function lock64(arr) {
    while (true) {
        if (Atomics.compareExchange(arr, 0, UNLOCKED64, LOCKED64) !== LOCKED64)
            return;
        Atomics.wait(arr, 0, LOCKED64);
    }
}
function unlock64(arr) {
    Atomics.store(arr, 0, UNLOCKED64);
    Atomics.notify(arr, 0, 1);
}
function toTypedArray(Type, arr) {
    if (arr != null) {
        const bytes = Type.BYTES_PER_ELEMENT;
        const name = Type.name;
        if (arr instanceof SharedArrayBuffer) {
            if (arr.byteLength % bytes !== 0) {
                throw new Error(`SharedArrayBuffer must be a multiple of ${name}.BYTES_PER_ELEMENT ${bytes} bytes long`);
            }
            return new Type(arr);
        }
        else if (arr instanceof Type) {
            if (!(arr.buffer instanceof SharedArrayBuffer)) {
                throw new Error('Invalid typed array buffer, must be instanceof SharedArrayBuffer');
            }
            return arr;
        }
        else {
            throw new Error(`Invalid parameter, must be SharedArrayBuffer or ${name}`);
        }
    }
    return undefined;
}
class AtomicLock {
    #array;
    constructor(array) {
        this.#array = toTypedArray(Int32Array, array) ?? new Int32Array(new SharedArrayBuffer(4));
    }
    get buffer() {
        return this.#array.buffer;
    }
    lock() {
        lock(this.#array);
    }
    unlock() {
        unlock(this.#array);
    }
    synchronize(fn) {
        this.lock();
        try {
            return fn();
        }
        finally {
            this.unlock();
        }
    }
    async asynchronize(fn) {
        this.lock();
        try {
            return await fn();
        }
        finally {
            this.unlock();
        }
    }
}
class AtomicInt {
    #name;
    #array;
    #editor;
    constructor(Type, input) {
        if (input instanceof Type) {
            if (!(input.buffer instanceof SharedArrayBuffer)) {
                throw new Error(`${Type.name} buffer not SharedArrayBuffer`);
            }
            this.#array = input;
        }
        else if (input instanceof SharedArrayBuffer) {
            this.#array = new Type(input);
        }
        else {
            this.#array = new Type(new SharedArrayBuffer(Type.BYTES_PER_ELEMENT * 2));
        }
        this.#name = 'Atomic' + Type.name.replace('Array', '');
        if (typeof input === 'number') {
            Atomics.store(this.#array, DATA_INDEX, input);
        }
        this.#editor = Object.defineProperty({}, 'value', {
            get: () => this.#array[DATA_INDEX],
            //get: (): number => Atomics.load(this.#array, DATA_INDEX) as unknown as number,
            set: (value) => this.#array[DATA_INDEX] = value,
            //set: (value: number) => {Atomics.store(this.#array, DATA_INDEX, value);},
        });
    }
    get [Symbol.toStringTag]() { return this.name; }
    get name() { return this.#name; }
    get buffer() { return this.#array.buffer; }
    /**
     * Lock free value editor
     */
    get $() { return this.#editor; }
    get value() {
        return this.#synchronize(() => this.#array[DATA_INDEX]);
    }
    set value(val) {
        this.#synchronize(() => this.#array[DATA_INDEX] = val);
    }
    increment() {
        return this.#synchronize(() => ++this.#array[DATA_INDEX]);
    }
    decrement() {
        return this.#synchronize(() => --this.#array[DATA_INDEX]);
    }
    add(value) {
        return this.#synchronize(() => (this.#array[DATA_INDEX] += value, this.#array[DATA_INDEX]));
    }
    sub(value) {
        return this.#synchronize(() => (this.#array[DATA_INDEX] -= value, this.#array[DATA_INDEX]));
    }
    synchronize(fn) {
        this.lock();
        try {
            return fn(this.#editor);
        }
        finally {
            this.unlock();
        }
    }
    async asynchronize(fn) {
        this.lock();
        try {
            return await fn(this.#editor);
        }
        finally {
            this.unlock();
        }
    }
    lock() {
        lock(this.#array);
    }
    unlock() {
        unlock(this.#array);
    }
    #synchronize(fn) {
        try {
            this.lock();
            return fn();
        }
        finally {
            this.unlock();
        }
    }
}
class AtomicInt8 extends AtomicInt {
    static get BYTE_SIZE() { return 1; }
    static get UNSIGNED() { return false; }
    static get MIN() { return -128; }
    static get MAX() { return 127; }
    constructor(input) {
        super(Int8Array, input);
    }
}
class AtomicInt16 extends AtomicInt {
    static get BYTE_SIZE() { return 2; }
    static get UNSIGNED() { return false; }
    static get MIN() { return -32768; }
    static get MAX() { return 32767; }
    constructor(input) {
        super(Int16Array, input);
    }
}
class AtomicInt32 extends AtomicInt {
    static get BYTE_SIZE() { return 4; }
    static get UNSIGNED() { return false; }
    static get MIN() { return -2147483648; }
    static get MAX() { return 2147483647; }
    constructor(input) {
        super(Int32Array, input);
    }
}
class AtomicUint8 extends AtomicInt {
    static get BYTE_SIZE() { return 1; }
    static get UNSIGNED() { return true; }
    static get MIN() { return 0; }
    static get MAX() { return 255; }
    constructor(input) {
        super(Uint8Array, input);
    }
}
class AtomicUint16 extends AtomicInt {
    static get BYTE_SIZE() { return 2; }
    static get UNSIGNED() { return true; }
    static get MIN() { return 0; }
    static get MAX() { return 65535; }
    constructor(input) {
        super(Uint16Array, input);
    }
}
class AtomicUint32 extends AtomicInt {
    static get BYTE_SIZE() { return 4; }
    static get UNSIGNED() { return true; }
    static get MIN() { return 0; }
    static get MAX() { return 4294967295; }
    constructor(input) {
        super(Uint32Array, input);
    }
}
class AtomicBigInt {
    #name;
    #array;
    #editor;
    constructor(Type, input) {
        if (input instanceof Type) {
            if (!(input.buffer instanceof SharedArrayBuffer)) {
                throw new Error(`${Type.name} buffer not SharedArrayBuffer`);
            }
            this.#array = input;
        }
        else if (input instanceof SharedArrayBuffer) {
            this.#array = new Type(input);
        }
        else {
            this.#array = new Type(new SharedArrayBuffer(Type.BYTES_PER_ELEMENT * 2));
        }
        this.#name = 'Atomic' + Type.name.replace('Array', '');
        if (typeof input === 'bigint') {
            Atomics.store(this.#array, DATA_INDEX, input);
        }
        else if (typeof input === 'number') {
            Atomics.store(this.#array, DATA_INDEX, BigInt(input));
        }
        this.#editor = Object.defineProperty({}, 'value', {
            get: () => this.#array[DATA_INDEX],
            set: (value) => this.#array[DATA_INDEX] = value,
        });
    }
    get [Symbol.toStringTag]() { return this.#name; }
    get name() { return this.#name; }
    get buffer() { return this.#array.buffer; }
    get $() { return this.#editor; }
    get value() {
        return this.#synchronize(() => this.#array[DATA_INDEX]);
    }
    set value(val) {
        this.#synchronize(() => this.#array[DATA_INDEX] = val);
    }
    increment() {
        return this.#synchronize(() => ++this.#array[DATA_INDEX]);
    }
    decrement() {
        return this.#synchronize(() => --this.#array[DATA_INDEX]);
    }
    add(value) {
        return this.#synchronize(() => (this.#array[DATA_INDEX] += value, this.#array[DATA_INDEX]));
    }
    sub(value) {
        return this.#synchronize(() => (this.#array[DATA_INDEX] -= value, this.#array[DATA_INDEX]));
    }
    synchronize(fn) {
        this.lock();
        try {
            return fn(this.#editor);
        }
        finally {
            this.unlock();
        }
    }
    async asynchronize(fn) {
        this.lock();
        try {
            return await fn(this.#editor);
        }
        finally {
            this.unlock();
        }
    }
    lock() {
        lock64(this.#array);
    }
    unlock() {
        unlock64(this.#array);
    }
    #synchronize(fn) {
        try {
            this.lock();
            return fn();
        }
        finally {
            this.unlock();
        }
    }
}
class AtomicBigInt64 extends AtomicBigInt {
    static get BYTE_SIZE() { return 8; }
    static get UNSIGNED() { return false; }
    static get MIN() { return -(2n ** 63n); }
    static get MAX() { return 2n ** 63n - 1n; }
    constructor(input) {
        super(BigInt64Array, input);
    }
}
class AtomicBigUint64 extends AtomicBigInt {
    static get BYTE_SIZE() { return 8; }
    static get UNSIGNED() { return true; }
    static get MIN() { return 0n; }
    static get MAX() { return 2n ** 64n - 1n; }
    constructor(input) {
        super(BigUint64Array, input);
    }
}
class AtomicBool {
    #array;
    #editor;
    constructor(input) {
        if (input == null) {
            this.#array = new Int8Array(new SharedArrayBuffer(2));
        }
        else {
            if (input instanceof Int8Array) {
                if (!(input.buffer instanceof SharedArrayBuffer)) {
                    throw new Error(`buffer not SharedArrayBuffer`);
                }
                this.#array = input;
            }
            else if (input instanceof SharedArrayBuffer) {
                this.#array = new Int8Array(input);
            }
            else {
                if (typeof input === 'boolean') {
                    this.#array = new Int8Array(new SharedArrayBuffer(2));
                    Atomics.store(this.#array, DATA_INDEX, input ? 1 : 0);
                }
                else {
                    throw new Error(`input must be Int8Array or SharedArrayBuffer or boolean`);
                }
            }
        }
        this.#editor = {};
        Object.defineProperty(this.#editor, 'value', {
            get: () => this.#getValue(),
            set: (value) => this.#setValue(value),
        });
        Object.defineProperty(this.#editor, 'not', {
            value: () => this.#setValue(!this.#getValue()),
        });
    }
    get [Symbol.toStringTag]() { return this.name; }
    get name() { return 'AtomicBool'; }
    get buffer() { return this.#array.buffer; }
    /**
     * Lock free value editor
     */
    get $() { return this.#editor; }
    #getValue() { return this.#array[DATA_INDEX] === 1; }
    #setValue(v) {
        v = !!v;
        this.#array[DATA_INDEX] = v ? 1 : 0;
        return v;
    }
    get value() {
        return this.#synchronize(() => this.#getValue());
    }
    set value(val) {
        this.#synchronize(() => this.#setValue(val));
    }
    not() {
        return this.#synchronize(() => this.#setValue(!this.#getValue()));
    }
    synchronize(fn) {
        this.lock();
        try {
            return fn(this.#editor);
        }
        finally {
            this.unlock();
        }
    }
    async asynchronize(fn) {
        this.lock();
        try {
            return await fn(this.#editor);
        }
        finally {
            this.unlock();
        }
    }
    lock() {
        lock(this.#array);
    }
    unlock() {
        unlock(this.#array);
    }
    #synchronize(fn) {
        try {
            this.lock();
            return fn();
        }
        finally {
            this.unlock();
        }
    }
}
/**
 * Semaaphore implementation class.
 */
class Semaphore {
    /**
     * Create Semaphore instance from existing SharedArrayBuffer.
     * @param {SharedArrayBuffer} buffer Constructed SharedArrayBuffer.
     * @param {number} count The number which allowed to enter critical section.
     * @returns {Semaphore}
     */
    static from(buffer) {
        let count = 0;
        if (buffer instanceof Int32Array) {
            count = buffer.length;
        }
        else if (buffer instanceof SharedArrayBuffer) {
            if (buffer.byteLength % 4 !== 0) {
                throw new Error('buffer length must be multiple of 4');
            }
            count = buffer.byteLength / 4;
        }
        else {
            throw new Error('buffer must be SharedArrayBuffer or Int32Array');
        }
        if (count < 1) {
            throw new Error('buffer length must be greater than 0');
        }
        return new Semaphore(count, buffer);
    }
    #count;
    #current;
    #array;
    /**
     * construct Semaphore.
     * If `buffer` is passed, this semaphore constructed from that SharedArrayBuffer or Int32Array.
     * @param {number} count Number of allowed to enter critical section.
     * @param {SharedArrayBuffer} buffer Optional SharedArrayBuffer or Int32Array.
     */
    constructor(count, buffer) {
        //const buf = buffer || new SharedArrayBuffer(count % 4 !== 0 ? count * 4 : count);
        if (buffer == null) {
            this.#array = new Int32Array(new SharedArrayBuffer(count * 4));
        }
        else {
            if (buffer instanceof Int32Array) {
                if (!(buffer.buffer instanceof SharedArrayBuffer)) {
                    throw new Error('buffer must be Int32Array with Int32Array.buffer as SharedArrayBuffer');
                }
                if (buffer.length !== count) {
                    throw new Error('buffer length is not equal to count');
                }
                this.#array = buffer;
            }
            else if (buffer instanceof SharedArrayBuffer) {
                if ((buffer.byteLength / 4) !== count) {
                    throw new Error('buffer length is not equal to count');
                }
                this.#array = new Int32Array(buffer);
            }
            else {
                throw new Error('buffer must be SharedArrayBuffer or Int32Array');
            }
        }
        this.#count = count;
        this.#current = undefined;
    }
    /**
     * Return SharedArrayBuffer.
     * This method often used in main thread.
     * @returns {SharedArrayBuffer}
     * @example
     *
     * const worker = new Worker('...');
     * const semaphore = new Semaphore();
     * worker.postMessage({ shared: semaphore.buffer });
     */
    get buffer() {
        return this.#array.buffer;
    }
    /**
     * Release occupied section.
     */
    signal() {
        if (this.#current === undefined)
            return;
        const index = this.#current;
        this.#current = undefined;
        Atomics.store(this.#array, index, UNLOCKED);
    }
    acquire() {
        if (this.#current !== undefined)
            return;
        while (true) {
            for (let i = 0; i < this.#count; i++) {
                if (Atomics.compareExchange(this.#array, i, UNLOCKED, LOCKED) === UNLOCKED) {
                    this.#current = i;
                    return;
                }
            }
        }
    }
    synchronize(fn) {
        this.acquire();
        try {
            return fn();
        }
        finally {
            this.signal();
        }
    }
    async asynchronize(fn) {
        this.acquire();
        try {
            return await fn();
        }
        finally {
            this.signal();
        }
    }
}
class Mutex extends Semaphore {
    constructor(buffer) {
        super(1, buffer);
    }
    static from(buffer) {
        return new Mutex(buffer);
    }
}
function sleep(ms) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
exports.AtomicBigInt64 = AtomicBigInt64;
exports.AtomicBigUint64 = AtomicBigUint64;
exports.AtomicBool = AtomicBool;
exports.AtomicInt16 = AtomicInt16;
exports.AtomicInt32 = AtomicInt32;
exports.AtomicInt8 = AtomicInt8;
exports.AtomicLock = AtomicLock;
exports.AtomicUint16 = AtomicUint16;
exports.AtomicUint32 = AtomicUint32;
exports.AtomicUint8 = AtomicUint8;
exports.Mutex = Mutex;
exports.Semaphore = Semaphore;
exports.sleep = sleep;
//# sourceMappingURL=index.js.map