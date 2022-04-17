import { IEditor, IBoolEditor } from './types';

const UNLOCKED64 = 0n;
const LOCKED64 = 1n;
export const UNLOCKED = 0;
export const LOCKED = 1;
export const DATA_INDEX = 1;

export function lock(arr: any): void {
	while (true) {
		if (Atomics.compareExchange(arr, 0, UNLOCKED, LOCKED) === UNLOCKED) return;
		Atomics.wait(arr, 0, LOCKED);
	}
}

export function unlock(arr: any): void {
	if (Atomics.compareExchange(arr, 0, LOCKED, UNLOCKED) !== LOCKED) {
		throw new Error("Inconsistent state: unlock on unlocked Mutex.");
	}
	Atomics.notify(arr, 0, 1);
	//Atomics.store(arr, 0, UNLOCKED);
	//Atomics.notify(arr, 0, 1);
}

export function lock64(arr: any): void {
	while (true) {
		if (Atomics.compareExchange(arr, 0, UNLOCKED64, LOCKED64) === UNLOCKED64) return;
		Atomics.wait(arr, 0, LOCKED64);
	}
}

export function unlock64(arr: any): void {
	if (Atomics.compareExchange(arr, 0, LOCKED64, UNLOCKED64) !== LOCKED64) {
		throw new Error("Inconsistent state: unlock on unlocked Mutex.");
	}
	Atomics.notify(arr, 0, 1);
}

export function synchronize<T>(arr: any, fn: () => T) {
	try {
		lock(arr);
		return fn();
	} finally {
		unlock(arr);
	}
}

export function synchronize64<T>(arr: any, fn: () => T) {
	try {
		lock64(arr);
		return fn();
	} finally {
		unlock64(arr);
	}
}

export async function asynchronize<T>(arr: any, fn: () => Promise<T>) {
	lock(arr);
	try {
		return await fn();
	} finally {
		unlock(arr);
	}
}

export async function asynchronize64<T>(arr: any, fn: () => Promise<T>) {
	lock64(arr);
	try {
		return await fn();
	} finally {
		unlock64(arr);
	}
}

export function getValue<T>(arr: any): T {
	return arr[DATA_INDEX];
}

export function setValue<T>(arr: any, v: T) {
	if (typeof v === 'boolean') {
		arr[DATA_INDEX] = v ? 1 : 0;
		return arr[DATA_INDEX] === 1;
	}
	return arr[DATA_INDEX] = v;
}

export const bool2int = (v: boolean): number => !!v ? 1 : 0;
export const int2bool = (v: number): boolean => v !== 0;

export function createEditor<T>(arr: any): IEditor<T> {
	return Object.freeze({
		get value(): T { return arr[DATA_INDEX]; },
		set value(v: T) { arr[DATA_INDEX] = v; }
	});
}

export function createBoolEditor(arr: any): IBoolEditor {
	return Object.freeze({
		get value(): boolean { return int2bool(arr[DATA_INDEX]); },
		set value(v: boolean) { arr[DATA_INDEX] = bool2int(v); },
		not: (): boolean => int2bool(arr[DATA_INDEX] = arr[DATA_INDEX] !== 0 ? 0 : 1)
	});
}

export function toTypedArray<T>(Type: any, arr?: any): T | undefined {
	if (arr != null) {
		const bytes: number = Type.BYTES_PER_ELEMENT;
		const name: string = Type.name;
		if (arr instanceof SharedArrayBuffer) {
			if (arr.byteLength % bytes !== 0) {
				throw new Error(`SharedArrayBuffer must be a multiple of ${name}.BYTES_PER_ELEMENT ${bytes} bytes long`);
			}
			return new Type(arr) as T;
		} else if (arr instanceof Type) {
			if (!(arr.buffer instanceof SharedArrayBuffer)) {
				throw new Error("Invalid typed array buffer, must be instanceof SharedArrayBuffer");
			}
			return arr as T;
		} else {
			throw new Error(`Invalid parameter, must be SharedArrayBuffer or ${name}`);
		}
	}
	return undefined;
}
