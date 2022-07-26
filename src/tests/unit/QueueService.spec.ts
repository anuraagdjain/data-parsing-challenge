import { expect } from 'chai';
import Sinon from 'sinon';
import axios from 'axios';
import QueueService from '../../services/QueueService';

describe('QueueService unit test', function () {
	let apiConfig: any;
	let axiosSpy: any;
	let logger: any;
	let queueService: QueueService;
	let clock: Sinon.SinonFakeTimers;

	beforeEach('setup', function () {
		axiosSpy = Sinon.stub(axios, 'post');
		// axiosSpy.
		logger = {
			info: Sinon.spy(),
			error: Sinon.spy(),
		};
		apiConfig = {
			host: 'localhost',
			port: 7299,
			protocol: 'http',
		};
		clock = Sinon.useFakeTimers();
		queueService = new QueueService(apiConfig, logger);
	});

	describe('queueHandler', function () {
		it('pushes data to sink', async function () {
			axiosSpy.resolves();
			const task = { id: '5fb281fe5fb9073c760991f2b71705c0', kind: 'joined' };
			queueService.push(task);
			await clock.tickAsync(2000);

			expect(axiosSpy.callCount).to.be.eq(1);
			expect(axiosSpy.firstCall.args[0]).to.be.eq('http://localhost:7299/sink/a');
			expect(axiosSpy.firstCall.args[1]).to.deep.eq(task);
		});
	});
});
