import ISource from '../interface/ISource';
import axios from 'axios';

class SourceAService implements ISource {
	private cache: Map<string, string>;
	private url;
	private logger: any;
	private queueService: any;
	private isRunning: boolean;
	constructor(apiConfig: any, cache: Map<string, string> = new Map(), queueService: any, logger: any) {
		this.cache = cache;
		this.url = `${apiConfig.protocol}://${apiConfig.host}:${apiConfig.port}`;
		this.logger = logger;
		this.queueService = queueService;
		this.isRunning = false;
	}

	async fetch(): Promise<void> {
		this.isRunning = true;
		while (this.isRunning) {
			try {
				const { data: payload } = await axios.get(`${this.url}/source/a`);
				if (payload.status == 'done') {
					this.logger.info(`Source ${this.url} is done`);
					this.isRunning = false;
					return Promise.resolve();
				}
				if (payload.id) {
					this.updateStatus(payload.id);
				} else {
					this.logger.debug('Found defective record');
				}
			} catch (err: any) {
				this.logger.error(`Failure at source A - ${err.message}`);
			}
		}
	}

	updateStatus(id: string): void {
		if (this.cache.has(id)) {
			this.cache.delete(id);
			this.queueService.push({ id, kind: 'joined' });
		} else {
			this.cache.set(id, 'orphaned');
		}
	}
}

export default SourceAService;
