const { workerData, threadId } = require("worker_threads");
const delay = require('timers/promises').setTimeout;
const { WaitGroup, Mutex } = require("../../");

async function main() {
	process.stdout.write(`${threadId} worker start`);
	//console.log(`${threadId} worker started`);
	const waitGroup = WaitGroup.from(workerData.waitGroupBuffer);
	const mutex = Mutex.from(workerData.mutexBuffer);
	const count = new Int32Array(workerData.sab);

	mutex.lock();
	Array(1000).fill(null).forEach(() => count[0]++);
	process.stdout.write(JSON.stringify({ threadId, count: count[0] }));
	mutex.unlock();

	// Simulate intensive computation.
	await delay(1000);
	waitGroup.done();
	process.stdout.write(`${threadId} worker end`);
	//console.log(`${threadId} worker end`);
}

main();
