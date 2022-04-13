const UNLOCKED = 0;
const LOCKED = 1;
const UNLOCKED64 = 0n;
const LOCKED64 = 1n;

export const DATA_INDEX = 1;

export function lock(arr: any): void {
	while (true) {
		if (Atomics.compareExchange(arr, 0, UNLOCKED, LOCKED) !== LOCKED) return;
		Atomics.wait(arr, 0, LOCKED);
	}
}

export function lock64(arr: any): void {
	while (true) {
		if (Atomics.compareExchange(arr, 0, UNLOCKED64, LOCKED64) !== LOCKED64) return;
		Atomics.wait(arr, 0, LOCKED64);
	}
}

export function unlock(arr: any): void {
	Atomics.store(arr, 0, UNLOCKED);
	Atomics.notify(arr, 0, 1);
}

export function unlock64(arr: any): void {
	Atomics.store(arr, 0, UNLOCKED64);
	Atomics.notify(arr, 0, 1);
}

export function synchronize(arr: any, fn: () => any) {
	let _unlocked = false;
	const _unlock = () => {
		if (_unlocked) return;
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
				} finally {
					_unlock();
				}
			})();
		} else {
			return result;
		}
	} finally {
		_unlock();
	}
}

export function synchronize64(arr: any, fn: () => any) {
	let _unlocked = false;
	const _unlock = () => {
		if (_unlocked) return;
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
				} finally {
					_unlock();
				}
			})();
		} else {
			return result;
		}
	} finally {
		_unlock();
	}
}