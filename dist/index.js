/**
 * @devteks/node-atomics
 * Node.js Atomic thread safe tools
 * Version: 0.0.3
 * Author: Mosa Muhana (https://github.com/mosamuhana)
 * License: MIT
 * Homepage: https://github.com/mosamuhana/node-atomics#readme
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
        if (Atomics.compareExchange(arr, 0, UNLOCKED, LOCKED) === UNLOCKED)
            return;
        Atomics.wait(arr, 0, LOCKED);
    }
}
function unlock(arr) {
    if (Atomics.compareExchange(arr, 0, LOCKED, UNLOCKED) !== LOCKED) {
        throw new Error("Inconsistent state: unlock on unlocked Mutex.");
    }
    Atomics.notify(arr, 0, 1);
    //Atomics.store(arr, 0, UNLOCKED);
    //Atomics.notify(arr, 0, 1);
}
function lock64(arr) {
    while (true) {
        if (Atomics.compareExchange(arr, 0, UNLOCKED64, LOCKED64) === UNLOCKED64)
            return;
        Atomics.wait(arr, 0, LOCKED64);
    }
}
function unlock64(arr) {
    if (Atomics.compareExchange(arr, 0, LOCKED64, UNLOCKED64) !== LOCKED64) {
        throw new Error("Inconsistent state: unlock on unlocked Mutex.");
    }
    Atomics.notify(arr, 0, 1);
}
function synchronize(arr, fn) {
    try {
        lock(arr);
        return fn();
    }
    finally {
        unlock(arr);
    }
}
function synchronize64(arr, fn) {
    try {
        lock64(arr);
        return fn();
    }
    finally {
        unlock64(arr);
    }
}
async function asynchronize(arr, fn) {
    lock(arr);
    try {
        return await fn();
    }
    finally {
        unlock(arr);
    }
}
async function asynchronize64(arr, fn) {
    lock64(arr);
    try {
        return await fn();
    }
    finally {
        unlock64(arr);
    }
}
const bool2int = (v) => !!v ? 1 : 0;
const int2bool = (v) => v !== 0;
function createEditor(arr) {
    return Object.freeze({
        get value() { return arr[DATA_INDEX]; },
        set value(v) { arr[DATA_INDEX] = v; }
    });
}
function createBoolEditor(arr) {
    return Object.freeze({
        get value() { return int2bool(arr[DATA_INDEX]); },
        set value(v) { arr[DATA_INDEX] = bool2int(v); },
        not: () => int2bool(arr[DATA_INDEX] = arr[DATA_INDEX] !== 0 ? 0 : 1)
    });
}

class Mutex {
    static from(buffer) {
        return new Mutex(buffer);
    }
    #array;
    constructor(input) {
        if (input == null) {
            this.#array = new Int32Array(new SharedArrayBuffer(4));
        }
        else if (input instanceof SharedArrayBuffer) {
            if (input.byteLength != 4) {
                throw new Error("Mutex buffer must be 4 bytes.");
            }
            this.#array = new Int32Array(input);
        }
        else if (input instanceof Int32Array) {
            if (input.length != 1) {
                throw new Error("Mutex buffer must be 4 bytes.");
            }
            this.#array = input;
        }
        else {
            throw new Error(`Invalid parameter type`);
        }
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
        return synchronize(this.#array, fn);
    }
    async asynchronize(fn) {
        return await asynchronize(this.#array, fn);
    }
}

class Semaphore {
    static from(buffer) {
        return new Semaphore(buffer);
    }
    #count;
    #current;
    #array;
    constructor(input) {
        if (typeof input === 'number') {
            if (!Number.isInteger(input) || input <= 0) {
                throw new Error("WaitGroup initial value must be an integer greater than zero.");
            }
            this.#array = new Int32Array(new SharedArrayBuffer(input * 4));
        }
        else {
            if (input instanceof Int32Array) {
                if (!(input.buffer instanceof SharedArrayBuffer)) {
                    throw new Error('buffer must be Int32Array with Int32Array.buffer as SharedArrayBuffer');
                }
                this.#array = input;
            }
            else if (input instanceof SharedArrayBuffer) {
                if ((input.byteLength % 4) !== 0) {
                    throw new Error('buffer length must be multiple of 4');
                }
                this.#array = new Int32Array(input);
            }
            else {
                throw new Error('buffer must be SharedArrayBuffer or Int32Array');
            }
        }
        this.#count = this.#array.length;
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

class WaitGroup {
    static from(buffer) {
        return new WaitGroup(buffer);
    }
    #array;
    constructor(input) {
        if (input == null) {
            this.#array = new Int32Array(new SharedArrayBuffer(4));
        }
        else if (input instanceof SharedArrayBuffer) {
            if (input.byteLength != 4) {
                throw new Error("WaitGroup buffer must be 4 bytes.");
            }
            this.#array = new Int32Array(input);
        }
        else if (input instanceof Int32Array) {
            if (input.length != 1) {
                throw new Error("WaitGroup buffer must be 4 bytes.");
            }
            this.#array = input;
        }
        else if (typeof input === 'number') {
            if (!Number.isInteger(input) || input <= 0) {
                throw new Error("WaitGroup initial value must be an integer greater than zero.");
            }
            const array = new Int32Array(new SharedArrayBuffer(4));
            array[0] = input;
            this.#array = array;
        }
        else {
            throw new Error(`Invalid type`);
        }
    }
    get buffer() {
        return this.#array.buffer;
    }
    add(n = 1) {
        const t = typeof n;
        if (t !== 'number' || !Number.isInteger(n) || n < 1) {
            throw new Error('WaitGroup must add integer >= 1');
        }
        this.#add(n);
    }
    done() {
        this.#add(-1);
    }
    wait() {
        while (true) {
            let count = Atomics.load(this.#array, 0);
            if (count == 0)
                return;
            if (Atomics.wait(this.#array, 0, count) == "ok")
                return;
        }
    }
    #add(n) {
        const current = n + Atomics.add(this.#array, 0, n);
        if (current < 0) {
            throw new Error("WaitGroup is in inconsistent state: negative count.");
        }
        if (current > 0)
            return;
        Atomics.notify(this.#array, 0);
    }
}

class AtomicInt {
    #name;
    #array;
    #editor;
    constructor(Type, input) {
        const size = Type.BYTES_PER_ELEMENT * 2;
        this.#name = 'Atomic' + Type.name.replace('Array', '');
        if (input == null) {
            this.#array = new Type(new SharedArrayBuffer(size));
        }
        else if (input instanceof SharedArrayBuffer) {
            if (input.byteLength != size) {
                throw new Error(`${this.#name} buffer must be ${size} bytes.`);
            }
            this.#array = new Type(input);
        }
        else if (input instanceof Type) {
            if (input.length != 2) {
                throw new Error(`${this.#name} array must be 2 items.`);
            }
            this.#array = input;
        }
        else if (typeof input === 'number') {
            if (isNaN(input) || !Number.isInteger(input)) {
                throw new Error(`${this.#name} initial value must be an integer.`);
            }
            this.#array = new Type(new SharedArrayBuffer(size));
            this.#array[0] = input;
        }
        else {
            throw new Error(`Invalid parameter type.`);
        }
        this.#editor = createEditor(this.#array);
    }
    get [Symbol.toStringTag]() { return this.name; }
    get name() { return this.#name; }
    get buffer() { return this.#array.buffer; }
    /**
     * Lock free value editor
     */
    get $() { return this.#editor; }
    get value() {
        return synchronize(this.#array, () => this.#array[DATA_INDEX]);
    }
    set value(val) {
        synchronize(this.#array, () => this.#array[DATA_INDEX] = val);
    }
    increment() {
        return synchronize(this.#array, () => ++this.#array[DATA_INDEX]);
    }
    decrement() {
        return synchronize(this.#array, () => --this.#array[DATA_INDEX]);
    }
    add(value) {
        return synchronize(this.#array, () => (this.#array[DATA_INDEX] += value, this.#array[DATA_INDEX]));
    }
    sub(value) {
        return synchronize(this.#array, () => (this.#array[DATA_INDEX] -= value, this.#array[DATA_INDEX]));
    }
    synchronize(fn) {
        return synchronize(this.#array, () => fn(this.#editor));
    }
    lock() {
        lock(this.#array);
    }
    unlock() {
        unlock(this.#array);
    }
    async asynchronize(fn) {
        return await asynchronize(this.#array, () => fn(this.#editor));
    }
}
class AtomicInt8 extends AtomicInt {
    static get BYTE_SIZE() { return 1; }
    static get UNSIGNED() { return false; }
    static get MIN() { return -128; }
    static get MAX() { return 127; }
    static from(input) {
        return new AtomicInt8(input);
    }
    constructor(input) {
        super(Int8Array, input);
    }
}
class AtomicInt16 extends AtomicInt {
    static get BYTE_SIZE() { return 2; }
    static get UNSIGNED() { return false; }
    static get MIN() { return -32768; }
    static get MAX() { return 32767; }
    static from(input) {
        return new AtomicInt16(input);
    }
    constructor(input) {
        super(Int16Array, input);
    }
}
class AtomicInt32 extends AtomicInt {
    static get BYTE_SIZE() { return 4; }
    static get UNSIGNED() { return false; }
    static get MIN() { return -2147483648; }
    static get MAX() { return 2147483647; }
    static from(input) {
        return new AtomicInt32(input);
    }
    constructor(input) {
        super(Int32Array, input);
    }
}
class AtomicUint8 extends AtomicInt {
    static get BYTE_SIZE() { return 1; }
    static get UNSIGNED() { return true; }
    static get MIN() { return 0; }
    static get MAX() { return 255; }
    static from(input) {
        return new AtomicUint8(input);
    }
    constructor(input) {
        super(Uint8Array, input);
    }
}
class AtomicUint16 extends AtomicInt {
    static get BYTE_SIZE() { return 2; }
    static get UNSIGNED() { return true; }
    static get MIN() { return 0; }
    static get MAX() { return 65535; }
    static from(input) {
        return new AtomicUint16(input);
    }
    constructor(input) {
        super(Uint16Array, input);
    }
}
class AtomicUint32 extends AtomicInt {
    static get BYTE_SIZE() { return 4; }
    static get UNSIGNED() { return true; }
    static get MIN() { return 0; }
    static get MAX() { return 4294967295; }
    static from(input) {
        return new AtomicUint32(input);
    }
    constructor(input) {
        super(Uint32Array, input);
    }
}

class AtomicBigInt {
    #name;
    #array;
    #editor;
    constructor(Type, input) {
        const size = 16;
        this.#name = 'Atomic' + Type.name.replace('Array', '');
        if (input == null) {
            this.#array = new Type(new SharedArrayBuffer(size));
        }
        else if (input instanceof SharedArrayBuffer) {
            if (input.byteLength != size) {
                throw new Error(`${this.#name} buffer must be ${size} bytes.`);
            }
            this.#array = new Type(input);
        }
        else if (input instanceof Type) {
            if (input.length != 2) {
                throw new Error(`${this.#name} array must be 2 items.`);
            }
            this.#array = input;
        }
        else if (typeof input === 'bigint') {
            this.#array = new Type(new SharedArrayBuffer(size));
            this.#array[DATA_INDEX] = input;
        }
        else if (typeof input === 'number') {
            if (isNaN(input) || !Number.isInteger(input)) {
                throw new Error(`${this.#name} initial value must be an integer.`);
            }
            this.#array = new Type(new SharedArrayBuffer(size));
            this.#array[DATA_INDEX] = BigInt(input);
        }
        else {
            throw new Error(`Invalid parameter type.`);
        }
        this.#editor = createEditor(this.#array);
    }
    get [Symbol.toStringTag]() { return this.#name; }
    get name() { return this.#name; }
    get buffer() { return this.#array.buffer; }
    get $() { return this.#editor; }
    get value() {
        return synchronize64(this.#array, () => this.#array[DATA_INDEX]);
    }
    set value(val) {
        synchronize64(this.#array, () => this.#array[DATA_INDEX] = val);
    }
    increment() {
        return synchronize64(this.#array, () => ++this.#array[DATA_INDEX]);
    }
    decrement() {
        return synchronize64(this.#array, () => --this.#array[DATA_INDEX]);
    }
    add(value) {
        return synchronize64(this.#array, () => (this.#array[DATA_INDEX] += value, this.#array[DATA_INDEX]));
    }
    sub(value) {
        return synchronize64(this.#array, () => (this.#array[DATA_INDEX] -= value, this.#array[DATA_INDEX]));
    }
    synchronize(fn) {
        return synchronize64(this.#array, () => fn(this.#editor));
    }
    async asynchronize(fn) {
        return await asynchronize64(this.#array, () => fn(this.#editor));
    }
    lock() {
        lock64(this.#array);
    }
    unlock() {
        unlock64(this.#array);
    }
}
class AtomicBigInt64 extends AtomicBigInt {
    static get BYTE_SIZE() { return 8; }
    static get UNSIGNED() { return false; }
    static get MIN() { return -(2n ** 63n); }
    static get MAX() { return 2n ** 63n - 1n; }
    static from(input) {
        return new AtomicBigInt64(input);
    }
    constructor(input) {
        super(BigInt64Array, input);
    }
}
class AtomicBigUint64 extends AtomicBigInt {
    static get BYTE_SIZE() { return 8; }
    static get UNSIGNED() { return true; }
    static get MIN() { return 0n; }
    static get MAX() { return 2n ** 64n - 1n; }
    static from(input) {
        return new AtomicBigUint64(input);
    }
    constructor(input) {
        super(BigUint64Array, input);
    }
}

class AtomicBool {
    #array;
    #editor;
    constructor(input) {
        if (input == null) {
            this.#array = new Int32Array(new SharedArrayBuffer(8));
        }
        else if (input instanceof SharedArrayBuffer) {
            if (input.byteLength != 8) {
                throw new Error(`AtomicBool buffer must be 8 bytes.`);
            }
            this.#array = new Int32Array(input);
        }
        else if (input instanceof Int32Array) {
            if (input.length != 2) {
                throw new Error(`AtomicBool array must be 2 items.`);
            }
            this.#array = input;
        }
        else if (typeof input === 'boolean') {
            this.#array = new Int32Array(new SharedArrayBuffer(8));
            this.#array[0] = bool2int(input);
        }
        else {
            throw new Error(`Invalid parameter type.`);
        }
        this.#editor = createBoolEditor(this.#array);
    }
    get [Symbol.toStringTag]() { return this.name; }
    get name() { return 'AtomicBool'; }
    get buffer() { return this.#array.buffer; }
    /**
     * Lock free value editor
     */
    get $() { return this.#editor; }
    get value() {
        return synchronize(this.#array, () => this.#editor.value);
    }
    set value(v) {
        synchronize(this.#array, () => this.#editor.value = v);
    }
    not() {
        return synchronize(this.#array, () => this.#editor.not());
    }
    synchronize(fn) {
        return synchronize(this.#array, () => fn(this.#editor));
    }
    async asynchronize(fn) {
        return await asynchronize(this.#array, () => fn(this.#editor));
    }
    lock() {
        lock(this.#array);
    }
    unlock() {
        unlock(this.#array);
    }
}

function sleep(ms) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

class NotifyDone {
    #array;
    #done = false;
    constructor(buffer) {
        if (buffer == null || !(buffer instanceof SharedArrayBuffer) || buffer.byteLength != 4) {
            throw new Error('NotifyDone: buffer must be SharedArrayBuffer of byteLength = 4');
        }
        this.#array = new Int32Array(buffer);
    }
    async done() {
        if (this.#done)
            return;
        this.#done = true;
        Atomics.store(this.#array, 0, 1);
        Atomics.notify(this.#array, 0);
    }
}
class NotifyWait {
    #array = new Int32Array(new SharedArrayBuffer(4));
    #done = false;
    get buffer() {
        return this.#array.buffer;
    }
    async wait() {
        if (this.#done)
            return;
        this.#done = true;
        Atomics.wait(this.#array, 0, 0);
    }
}

exports.AtomicBigInt64 = AtomicBigInt64;
exports.AtomicBigUint64 = AtomicBigUint64;
exports.AtomicBool = AtomicBool;
exports.AtomicInt16 = AtomicInt16;
exports.AtomicInt32 = AtomicInt32;
exports.AtomicInt8 = AtomicInt8;
exports.AtomicUint16 = AtomicUint16;
exports.AtomicUint32 = AtomicUint32;
exports.AtomicUint8 = AtomicUint8;
exports.Mutex = Mutex;
exports.NotifyDone = NotifyDone;
exports.NotifyWait = NotifyWait;
exports.Semaphore = Semaphore;
exports.WaitGroup = WaitGroup;
exports.sleep = sleep;
