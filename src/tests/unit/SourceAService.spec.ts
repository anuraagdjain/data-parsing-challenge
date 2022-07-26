import { expect } from 'chai';
import Sinon from 'sinon';
import nock from 'nock';
import SourceAService from '../../services/SourceAService';

describe('Source A unit test', function () {
	let apiConfig: any;
	let logger: any;
	let cache: Map<string, string>;
	let sourceAService: SourceAService;
	let mockQueueService: any;

	beforeEach('setup', function () {
		logger = {
			info: Sinon.spy(),
			debug: Sinon.spy(),
		};
		apiConfig = {
			host: 'localhost',
			port: 7299,
			protocol: 'http',
		};
		const url = `${apiConfig.protocol}://${apiConfig.host}:${apiConfig.port}`;
		cache = new Map();

		nock(url)
			.get('/source/a')
			.reply(200, { id: '5fb281fe5fb9073c760991f2b71705c0' })
			.get('/source/a')
			.reply(200, { id: '324ad385ce02485e6a7fffd6296361aa' })
			.get('/source/a')
			.reply(200, { missingId: '' }) // unable to mock the exact malformed data
			.get('/source/a')
			.reply(200, { status: 'done' });

		mockQueueService = {
			push: Sinon.spy(),
		};

		sourceAService = new SourceAService(apiConfig, cache, mockQueueService, logger);
	});

	describe('fetch', function () {
		it('calls the source a url', async function () {
			await sourceAService.fetch();
			expect(nock.isDone()).to.be.true;
			expect(cache.get('5fb281fe5fb9073c760991f2b71705c0')).to.be.eq('orphaned');
		});

		it('saves data into cache as orphaned', async function () {
			await sourceAService.fetch();
			expect(cache.size).to.be.eq(2);

			for (const item in cache) {
				expect(item[1]).to.be.eq('orphaned');
			}
		});

		it('logs and doesnt save defective record', async function () {
			await sourceAService.fetch();
			expect(cache.size).to.be.eq(2);
			expect(logger.debug.firstCall.args[0]).to.be.eq('Found defective record');
		});
	});
});
