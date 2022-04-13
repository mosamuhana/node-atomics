/**
* @author Mosa Muhana <mosamuhana@gmail.com>
* https://github.com/mosamuhana
* See LICENSE file in root directory for full license.
*/
export class AtomicLock {
	#private;
	constructor(array?: Int32Array | SharedArrayBuffer);
	get buffer(): SharedArrayBuffer;
	lock(): void;
	unlock(): void;
	synchronize<T>(fn: () => T): T;
	synchronize<T>(fn: () => Promise<T>): Promise<T>;
}
export interface IEditor {
	get value(): number;
	set value(value: number);
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
	get $(): IEditor;
	get value(): number;
	set value(val: number);
	increment(): number;
	decrement(): number;
	add(value: number): number;
	sub(value: number): number;
	synchronize<T>(fn: (editor: IEditor) => T): T;
	synchronize<T>(fn: (editor: IEditor) => Promise<T>): Promise<T>;
	lock(): void;
	unlock(): void;
}
export class AtomicInt8 extends AtomicInt {
	static get BYTE_SIZE(): number;
	static get UNSIGNED(): boolean;
	static get MIN(): number;
	static get MAX(): number;
	constructor(input?: Int8Array | SharedArrayBuffer | number);
}
export class AtomicInt16 extends AtomicInt {
	static get BYTE_SIZE(): number;
	static get UNSIGNED(): boolean;
	static get MIN(): number;
	static get MAX(): number;
	constructor(input?: Int16Array | SharedArrayBuffer | number);
}
export class AtomicInt32 extends AtomicInt {
	static get BYTE_SIZE(): number;
	static get UNSIGNED(): boolean;
	static get MIN(): number;
	static get MAX(): number;
	constructor(input?: Int32Array | SharedArrayBuffer | number);
}
export class AtomicUint8 extends AtomicInt {
	static get BYTE_SIZE(): number;
	static get UNSIGNED(): boolean;
	static get MIN(): number;
	static get MAX(): number;
	constructor(input?: Uint8Array | SharedArrayBuffer | number);
}
export class AtomicUint16 extends AtomicInt {
	static get BYTE_SIZE(): number;
	static get UNSIGNED(): boolean;
	static get MIN(): number;
	static get MAX(): number;
	constructor(input?: Uint16Array | SharedArrayBuffer | number);
}
export class AtomicUint32 extends AtomicInt {
	static get BYTE_SIZE(): number;
	static get UNSIGNED(): boolean;
	static get MIN(): number;
	static get MAX(): number;
	constructor(input?: Uint32Array | SharedArrayBuffer | number);
}
export interface IEditor64 {
	get value(): bigint;
	set value(value: bigint);
}
declare abstract class AtomicBigInt {
	#private;
	constructor(Type: any, input: any);
	get [Symbol.toStringTag](): string;
	get name(): string;
	get buffer(): SharedArrayBuffer;
	get $(): IEditor64;
	get value(): bigint;
	set value(val: bigint);
	increment(): number;
	decrement(): number;
	add(value: bigint): bigint;
	sub(value: bigint): bigint;
	synchronize<T>(fn: (editor: IEditor64) => T): T;
	synchronize<T>(fn: (editor: IEditor64) => Promise<T>): Promise<T>;
	lock(): void;
	unlock(): void;
}
export class AtomicBigInt64 extends AtomicBigInt {
	static get BYTE_SIZE(): number;
	static get UNSIGNED(): boolean;
	static get MIN(): bigint;
	static get MAX(): bigint;
	constructor(input?: BigInt64Array | SharedArrayBuffer | number);
}
export class AtomicBigUint64 extends AtomicBigInt {
	static get BYTE_SIZE(): number;
	static get UNSIGNED(): boolean;
	static get MIN(): bigint;
	static get MAX(): bigint;
	constructor(input?: BigUint64Array | SharedArrayBuffer | number);
}
export function sleep(ms: number): void;