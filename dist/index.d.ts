/**
 * @devteks/node-atomics
 * Node.js Atomic thread safe tools
 * Version: 0.0.3
 * Author: Mosa Muhana (https://github.com/mosamuhana)
 * License: MIT
 * Homepage: https://github.com/mosamuhana/node-atomics#readme
 */

interface IEditor<T> {
    get value(): T;
    set value(value: T);
}
interface IBoolEditor extends IEditor<boolean> {
    get value(): boolean;
    set value(value: boolean);
    not(): boolean;
}

declare class Mutex {
    #private;
    static from(buffer: SharedArrayBuffer): Mutex;
    static from(buffer: Int32Array): Mutex;
    /**
     * Instantiate Mutex.
     * If buffer is provided, the mutex will use it as a backing array.
     * @param {SharedArrayBuffer} buffer Optional SharedArrayBuffer.
     */
    constructor();
    constructor(input: SharedArrayBuffer);
    constructor(input: Int32Array);
    get buffer(): SharedArrayBuffer;
    lock(): void;
    unlock(): void;
    synchronize<T>(fn: () => T): T;
    asynchronize<T>(fn: () => Promise<T>): Promise<T>;
}

declare class Semaphore {
    #private;
    /**
     * Create Semaphore instance from existing SharedArrayBuffer.
     * @param {SharedArrayBuffer} buffer Constructed SharedArrayBuffer.
     * @param {number} count The number which allowed to enter critical section.
     * @returns {Semaphore}
     */
    static from(buffer: SharedArrayBuffer): Semaphore;
    static from(buffer: Int32Array): Semaphore;
    /**
     * construct Semaphore.
     * If `buffer` is passed, this semaphore constructed from that SharedArrayBuffer or Int32Array.
     * @param {number} count Number of allowed to enter critical section.
     * @param {SharedArrayBuffer} buffer Optional SharedArrayBuffer or Int32Array.
     */
    constructor(count: number);
    constructor(buffer: SharedArrayBuffer);
    constructor(array: Int32Array);
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
    get buffer(): SharedArrayBuffer;
    /**
     * Release occupied section.
     */
    signal(): void;
    acquire(): void;
    synchronize<T>(fn: () => T): T;
    asynchronize<T>(fn: () => Promise<T>): Promise<T>;
}

declare class WaitGroup {
    #private;
    static from(buffer: SharedArrayBuffer): WaitGroup;
    static from(buffer: Int32Array): WaitGroup;
    constructor();
    constructor(initial: number);
    constructor(buffer: SharedArrayBuffer);
    constructor(array: Int32Array);
    get buffer(): SharedArrayBuffer;
    add(n?: number): void;
    done(): void;
    wait(): void;
}

declare abstract class AtomicInt {
    #private;
    constructor(Type: any, input: any);
    get [Symbol.toStringTag](): string;
    get name(): string;
    get buffer(): SharedArrayBuffer;
    /**
     * Lock free value editor
     */
    get $(): IEditor<number>;
    get value(): number;
    set value(val: number);
    increment(): number;
    decrement(): number;
    add(value: number): number;
    sub(value: number): number;
    synchronize<T>(fn: (editor: IEditor<number>) => T): T;
    lock(): void;
    unlock(): void;
    asynchronize<T>(fn: (editor: IEditor<number>) => Promise<T>): Promise<T>;
}
declare class AtomicInt8 extends AtomicInt {
    static get BYTE_SIZE(): number;
    static get UNSIGNED(): boolean;
    static get MIN(): number;
    static get MAX(): number;
    static from(buffer: SharedArrayBuffer): AtomicInt8;
    static from(array: Int8Array): AtomicInt8;
    constructor();
    constructor(array: Int8Array);
    constructor(buffer: SharedArrayBuffer);
    constructor(initial: number);
}
declare class AtomicInt16 extends AtomicInt {
    static get BYTE_SIZE(): number;
    static get UNSIGNED(): boolean;
    static get MIN(): number;
    static get MAX(): number;
    static from(buffer: SharedArrayBuffer): AtomicInt16;
    static from(array: Int16Array): AtomicInt16;
    constructor();
    constructor(array: Int16Array);
    constructor(buffer: SharedArrayBuffer);
    constructor(initial: number);
}
declare class AtomicInt32 extends AtomicInt {
    static get BYTE_SIZE(): number;
    static get UNSIGNED(): boolean;
    static get MIN(): number;
    static get MAX(): number;
    static from(buffer: SharedArrayBuffer): AtomicInt32;
    static from(array: Int32Array): AtomicInt32;
    constructor();
    constructor(array: Int32Array);
    constructor(buffer: SharedArrayBuffer);
    constructor(initial: number);
}
declare class AtomicUint8 extends AtomicInt {
    static get BYTE_SIZE(): number;
    static get UNSIGNED(): boolean;
    static get MIN(): number;
    static get MAX(): number;
    static from(buffer: SharedArrayBuffer): AtomicUint8;
    static from(array: Uint8Array): AtomicUint8;
    constructor();
    constructor(array: Uint8Array);
    constructor(buffer: SharedArrayBuffer);
    constructor(initial: number);
}
declare class AtomicUint16 extends AtomicInt {
    static get BYTE_SIZE(): number;
    static get UNSIGNED(): boolean;
    static get MIN(): number;
    static get MAX(): number;
    static from(buffer: SharedArrayBuffer): AtomicUint16;
    static from(array: Uint16Array): AtomicUint16;
    constructor();
    constructor(array: Uint16Array);
    constructor(buffer: SharedArrayBuffer);
    constructor(initial: number);
}
declare class AtomicUint32 extends AtomicInt {
    static get BYTE_SIZE(): number;
    static get UNSIGNED(): boolean;
    static get MIN(): number;
    static get MAX(): number;
    static from(buffer: SharedArrayBuffer): AtomicUint32;
    static from(array: Uint32Array): AtomicUint32;
    constructor();
    constructor(array: Uint32Array);
    constructor(buffer: SharedArrayBuffer);
    constructor(initial: number);
}

declare abstract class AtomicBigInt {
    #private;
    constructor(Type: any, input: any);
    get [Symbol.toStringTag](): string;
    get name(): string;
    get buffer(): SharedArrayBuffer;
    get $(): IEditor<bigint>;
    get value(): bigint;
    set value(val: bigint);
    increment(): number;
    decrement(): number;
    add(value: bigint): bigint;
    sub(value: bigint): bigint;
    synchronize<T>(fn: (editor: IEditor<bigint>) => T): T;
    asynchronize<T>(fn: (editor: IEditor<bigint>) => Promise<T>): Promise<T>;
    lock(): void;
    unlock(): void;
}
declare class AtomicBigInt64 extends AtomicBigInt {
    static get BYTE_SIZE(): number;
    static get UNSIGNED(): boolean;
    static get MIN(): bigint;
    static get MAX(): bigint;
    static from(buffer: SharedArrayBuffer): AtomicBigInt64;
    static from(array: BigInt64Array): AtomicBigInt64;
    constructor();
    constructor(array: BigInt64Array);
    constructor(buffer: SharedArrayBuffer);
    constructor(initial: number);
    constructor(initial: bigint);
}
declare class AtomicBigUint64 extends AtomicBigInt {
    static get BYTE_SIZE(): number;
    static get UNSIGNED(): boolean;
    static get MIN(): bigint;
    static get MAX(): bigint;
    static from(buffer: SharedArrayBuffer): AtomicBigUint64;
    static from(array: BigUint64Array): AtomicBigUint64;
    constructor();
    constructor(array: BigUint64Array);
    constructor(buffer: SharedArrayBuffer);
    constructor(initial: number);
    constructor(initial: bigint);
}

declare class AtomicBool {
    #private;
    constructor();
    constructor(inital: boolean);
    constructor(array: Int8Array);
    constructor(buffer: SharedArrayBuffer);
    get [Symbol.toStringTag](): string;
    get name(): string;
    get buffer(): SharedArrayBuffer;
    /**
     * Lock free value editor
     */
    get $(): IBoolEditor;
    get value(): boolean;
    set value(v: boolean);
    not(): boolean;
    synchronize<T>(fn: (editor: IBoolEditor) => T): T;
    asynchronize<T>(fn: (editor: IBoolEditor) => Promise<T>): Promise<T>;
    lock(): void;
    unlock(): void;
}

declare function sleep(ms: number): void;

export { AtomicBigInt64, AtomicBigUint64, AtomicBool, AtomicInt16, AtomicInt32, AtomicInt8, AtomicUint16, AtomicUint32, AtomicUint8, IBoolEditor, IEditor, Mutex, Semaphore, WaitGroup, sleep };
