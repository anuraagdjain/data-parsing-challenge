import async from 'async';
import axios from 'axios';

class QueueService {
	private url: string;
	private logger: any;
	private _queue: any;

	constructor(apiConfig: any, logger: any) {
		this.url = `${apiConfig.protocol}://${apiConfig.host}:${apiConfig.port}`;
		this.logger = logger;
		this.initQueue();
	}

	private initQueue() {
		this._queue = async.queue((task, callback) => this.queueHandler(task, callback), 100);
	}
	private async queueHandler(task: any, callback: Function) {
		try {
			this.logger.info(`Sending ${JSON.stringify(task)} to sink`);
			await axios.post(`${this.url}/sink/a`, task);
		} catch (error: any) {
			this.logger.error(`Failed to send data to sink - ${error.message}. Retrying`);
			this._queue.push(task);
		}
		callback();
	}

	public push(data: any) {
		this._queue.push(data);
	}

	public drain(): Promise<void> {
		return this._queue.drain();
	}
}

export default QueueService;
