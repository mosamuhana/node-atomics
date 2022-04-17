const { join } = require('path');
const { Worker } = require('worker_threads');
const { WaitGroup, Mutex } = require('../../');

function waitWorker(worker) {
	return new Promise((resolve, reject) => {
		worker.on('exit', resolve);
		worker.on('error', reject);
	});
}

async function main() {
	const workers = [];
	const sab = new SharedArrayBuffer(4);
	const count = new Int32Array(sab);
	const mutex = new Mutex();
	const size = 5;
	const waitGroup = new WaitGroup(size);

	for (let i = 0; i < size; i++) {
		const worker = new Worker(join(__dirname, './worker.js'), {
			stdout: true,
			workerData: {
				waitGroupBuffer: waitGroup.buffer,
				mutexBuffer: mutex.buffer,
				sab: sab
			}
		});
		//worker.stdout.on('data', data => console.log(`xxxx ${data}`));
		workers.push(worker);
	}

	waitGroup.wait();
	//await Promise.all(workers.map(waitWorker));
	console.log('Result:', count[0]);
}

main().then(() => console.log('Done'));
