import winston from 'winston';
import SourceAService from './services/SourceAService';
import SourceBService from './services/SourceBService';
import QueueService from './services/QueueService';

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	transports: [new winston.transports.Console()],
});

const cache = new Map<string, string>();
const apiConfigSourceA = {
	host: 'localhost',
	port: 7299,
	protocol: 'http',
};
const apiConfigSourceB = {
	host: 'localhost',
	port: 7299,
	protocol: 'http',
};
const apiConfigSinkA = {
	host: 'localhost',
	port: 7299,
	protocol: 'http',
};

const queueService = new QueueService(apiConfigSinkA, logger);

const sourceAService = new SourceAService(apiConfigSourceA, cache, queueService, logger);
const sourceBService = new SourceBService(apiConfigSourceB, cache, queueService, logger);

logger.info('Project init');
Promise.allSettled([sourceAService.fetch(), sourceBService.fetch()]).then(() => {
	logger.info('Finished processing joined records. Processing remaining records.');

	const orphanedItems = Array.from(cache, (obj) => ({ id: obj[0], kind: obj[1] }));
	queueService.push(orphanedItems);

	return queueService.drain();
});
