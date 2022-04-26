const { join } = require('path');
const { Worker, MessageChannel, receiveMessageOnPort } = require('worker_threads');
const { NotifyWait } = require('../../');

const { port1, port2 } = new MessageChannel();
const notify = new NotifyWait();

const worker = new Worker(join(__dirname, '/worker.js'), {
	workerData: { port: port2, notify: notify.buffer },
	transferList: [ port2 ]
});

worker.on('error', error => {
	console.error(error);
});

console.log('[MAIN] WAIT START');
notify.wait();
console.log('[MAIN] WAIT END');
const { text } = receiveMessageOnPort(port1)?.message;
console.log('[MAIN] length:', text.length);
