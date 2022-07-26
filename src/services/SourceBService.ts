import ISource from '../interface/ISource';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

class SourceBService implements ISource {
	private cache: Map<string, string>;
	private url;
	private logger: any;
	private queueService: any;
	private xmlParser: XMLParser;
	private isRunning: boolean;

	constructor(apiConfig: any, cache: Map<string, string> = new Map(), queueService: any, logger: any) {
		this.cache = cache;
		this.url = `${apiConfig.protocol}://${apiConfig.host}:${apiConfig.port}`;
		this.logger = logger;
		this.queueService = queueService;
		this.xmlParser = new XMLParser({ ignoreAttributes: false, trimValues: true, parseAttributeValue: true });
		this.isRunning = false;
	}

	async fetch(): Promise<void> {
		this.isRunning = true;
		while (this.isRunning) {
			try {
				const { data: xmlData } = await axios.get(`${this.url}/source/b`);
				const payload = this.xmlParser.parse(xmlData);

				if (payload) {
					if (Object.hasOwnProperty.call(payload.msg, 'done')) {
						this.logger.info(`Source ${this.url} is done`);
						this.isRunning = false;
						return Promise.resolve();
					}
					this.saveData(payload);
				}
			} catch (err: any) {
				this.logger.error(`Failure at source - ${err.message}`);
			}
		}
	}

	private saveData(payload: any) {
		if (payload.msg.id) {
			const id = payload.msg.id['@_value'];
			this.updateStatus(id);
		} else {
			this.logger.debug('Found defective record');
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

export default SourceBService;
