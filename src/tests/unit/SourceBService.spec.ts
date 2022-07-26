import { expect } from 'chai';
import Sinon from 'sinon';
import nock from 'nock';
import SourceBService from '../../services/SourceBService';

describe('Source B unit test', function () {
	let apiConfig: any;
	let logger: any;
	let cache: Map<string, string>;
	let sourceBService: SourceBService;
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
			.get('/source/b')
			.reply(
				200,
				'<?xml version="1.0" encoding="UTF-8"?><msg><id value="42e23a2dceae084d7b49e8670c5048a5"/></msg>'
			)
			.get('/source/b')
			.reply(
				200,
				'<?xml version="1.0" encoding="UTF-8"?><msg><id value="324ad385ce02485e6a7fffd6296361aa"/></msg>'
			)
			.get('/source/b')
			.reply(
				200,
				'<?xml version="1.0" encoding="UTF-8"?><msg><WTTJ66606F6EU6BH8OEYBAR9BZFKUN9NIHSQ<</foo></msg> '
			)
			.get('/source/b')
			.reply(200, '<?xml version="1.0" encoding="UTF-8"?><msg><done/></msg>');

		mockQueueService = {
			push: Sinon.spy(),
		};

		sourceBService = new SourceBService(apiConfig, cache, mockQueueService, logger);
	});

	describe('fetch', function () {
		it('calls the source a url', async function () {
			await sourceBService.fetch();
			expect(nock.isDone()).to.be.true;
			expect(cache.get('42e23a2dceae084d7b49e8670c5048a5')).to.be.eq('orphaned');
		});

		it('saves data into cache as orphaned', async function () {
			await sourceBService.fetch();
			expect(cache.size).to.be.eq(2);

			for (const item in cache) {
				expect(item[1]).to.be.eq('orphaned');
			}
		});

		it('logs and doesnt save defective record', async function () {
			await sourceBService.fetch();
			expect(cache.size).to.be.eq(2);
			expect(logger.debug.firstCall.args[0]).to.be.eq('Found defective record');
		});
	});
});
