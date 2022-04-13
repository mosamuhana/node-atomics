/**
* @author Mosa Muhana <mosamuhana@gmail.com>
* https://github.com/mosamuhana
* See LICENSE file in root directory for full license.
*/
'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const UNLOCKED = 0;
const LOCKED = 1;
const UNLOCKED64 = 0n;
const LOCKED64 = 1n;
const DATA_INDEX = 1;
function lock(arr) {
    while (true) {
        if (Atomics.compareExchange(arr, 0, UNLOCKED, LOCKED) !== LOCKED)
            return;
        Atomics.wait(arr, 0, LOCKED);
    }
}
function lock64(arr) {
    while (true) {
        if (Atomics.compareExchange(arr, 0, UNLOCKED64, LOCKED64) !== LOCKED64)
            return;
        Atomics.wait(arr, 0, LOCKED64);
    }
}
function unlock(arr) {
    Atomics.store(arr, 0, UNLOCKED);
    Atomics.notify(arr, 0, 1);
}
function unlock64(arr) {
    Atomics.store(arr, 0, UNLOCKED64);
    Atomics.notify(arr, 0, 1);
}
function synchronize(arr, fn) {
    let _unlocked = false;
    const _unlock = () => {
        if (_unlocked)
            return;
        _unlocked = true;
        unlock(arr);
    };
    try {
        lock(arr);
        const result = fn();
        if (result && typeof result.then === 'function') {
            return (async () => {
                try {
                    return await result;
                }
                finally {
                    _unlock();
                }
            })();
        }
        else {
            return result;
        }
    }
    finally {
        _unlock();
    }
}
function synchronize64(arr, fn) {
    let _unlocked = false;
    const _unlock = () => {
        if (_unlocked)
            return;
        _unlocked = true;
        unlock64(arr);
    };
    try {
        lock64(arr);
        const result = fn();
        if (result && typeof result.then === 'function') {
            return (async () => {
                try {
                    return await result;
                }
                finally {
                    _unlock();
                }
            })();
        }
        else {
            return result;
        }
    }
    finally {
        _unlock();
    }
}
class AtomicLock {
    #array;
    constructor(array) {
        if (array == null) {
            this.#array = new Int32Array(new SharedArrayBuffer(4));
        }
        else {
            if (array instanceof SharedArrayBuffer) {
                if (array.byteLength !== 4) {
                    throw new Error('SharedArrayBuffer must be 4 bytes long');
                }
                this.#array = new Int32Array(array);
            }
            else if (array instanceof Int32Array) {
                this.#array = array;
            }
            else {
                throw new Error('Invalid lock buffer');
            }
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
            set: (value) => this.#array[DATA_INDEX] = value,
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
        return synchronize(this.#array, () => fn(this.#editor));
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
        return synchronize64(this.#array, () => fn(this.#editor));
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
function sleep(ms) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
exports.AtomicBigInt64 = AtomicBigInt64;
exports.AtomicBigUint64 = AtomicBigUint64;
exports.AtomicInt16 = AtomicInt16;
exports.AtomicInt32 = AtomicInt32;
exports.AtomicInt8 = AtomicInt8;
exports.AtomicLock = AtomicLock;
exports.AtomicUint16 = AtomicUint16;
exports.AtomicUint32 = AtomicUint32;
exports.AtomicUint8 = AtomicUint8;
exports.sleep = sleep;
//# sourceMappingURL=index.js.map