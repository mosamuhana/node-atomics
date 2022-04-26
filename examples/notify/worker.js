const { workerData } = require('worker_threads');
const delay = require('timers/promises').setTimeout;
const { NotifyDone } = require('../../');

async function getText() {
	await delay(1000,);
	return 'hello';
}

async function main() {
	const port = workerData.port;
	const notify = new NotifyDone(workerData.notify);

  const text = await getText();
	console.log('[WORKER] length:', text.length);
	await delay(1000);
  port.postMessage({ text });
	console.log('[WORKER] set');
	notify.done();
	await delay(1000);
	console.log('END WORKER');
}

main();
