const UNLOCKED64 = 0n;
const LOCKED64 = 1n;
export const UNLOCKED = 0;
export const LOCKED = 1;
export const DATA_INDEX = 1;

export function lock(arr: any): void {
	while (true) {
		if (Atomics.compareExchange(arr, 0, UNLOCKED, LOCKED) !== LOCKED) return;
		Atomics.wait(arr, 0, LOCKED);
	}
}

export function unlock(arr: any): void {
	Atomics.store(arr, 0, UNLOCKED);
	Atomics.notify(arr, 0, 1);
}

export function lock64(arr: any): void {
	while (true) {
		if (Atomics.compareExchange(arr, 0, UNLOCKED64, LOCKED64) !== LOCKED64) return;
		Atomics.wait(arr, 0, LOCKED64);
	}
}

export function unlock64(arr: any): void {
	Atomics.store(arr, 0, UNLOCKED64);
	Atomics.notify(arr, 0, 1);
}
