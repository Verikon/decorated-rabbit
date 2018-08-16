import {assert} from 'chai';
import fs from 'fs';
import path from 'path';

import DecoratedRabbit, {withRabbit, rpc, cte, pubsub, fnf, topic} from '../src';
import config from './config';

import {FnFClass1} from './mocks/FnFMocks';
import { AsyncResource } from 'async_hooks';

let _realObject = obj => { return (!!obj) && (obj.constructor === Object); };

describe('Topic Pattern Tests', function() {

	let Instance,
		ClassMock;

	describe('Preparation', () => {

		it('Instantiates FnF Mock class', () => {

			return new Promise((resolve, reject) => {
						
				ClassMock = new FnFClass1();
				ClassMock.mq.on('connected', () => {
					resolve();
				});
			});

		});

		it('Sets up the DecoratedRabbit instance', async () => {

			Instance = new DecoratedRabbit(config);
			const result = await Instance.initialize();
			assert(_realObject(result), 'result was not an object');
			assert(result.success === true, 'did not indicate success');
		});

	});

	describe('Runs FnF tests', () => {

		describe('Pattern FnF works with no arguments',() => {

			it('Invocation', () => {

				return new Promise( async (res, rej) => {

					const result = await Instance.fnf.invoke('fnf_test_1');
					assert(_realObject(result), 'result was not an object');
					assert(result.success === true, 'did not indicate success');

					//give some time for the queue to respond (FnF doesnt acknowledge)
					setTimeout(e => { res(); }, 1000);
				});

			});

			it('Assertion', () => {

				const file = path.resolve(__dirname, 'mocks', 'fnftest1.text');
				const contents = fs.readFileSync(file, 'utf8');
				assert(contents === 'test', 'failed');
			});

			it('Cleanup', () => {

				let file = path.resolve(__dirname, 'mocks', 'fnftest1.text');
				fs.unlinkSync(file); 
			})

		});

		describe('Pattern FnF works with arguments',() => {

			it('Invocation', () => {

				return new Promise( async (res, rej) => {

					const result = await Instance.fnf.invoke('fnf_test_2', {test:'that'});
					assert(_realObject(result), 'result was not an object');
					assert(result.success === true, 'did not indicate success');

					//give some time for the queue to respond (FnF doesnt acknowledge)
					setTimeout(e => { res(); }, 1000);
				});

			});

			it('Assertion', () => {

				const file = path.resolve(__dirname, 'mocks', 'fnftest2.json');
				const contents = fs.readFileSync(file, 'utf8');
				const parse = JSON.parse(contents);
				assert(parse.test === 'that', 'failed');
			});

			it('Cleanup', () => {

				let file = path.resolve(__dirname, 'mocks', 'fnftest2.json');
				fs.unlinkSync(file); 
			})

		});

		describe('Pattern FnF binds the class context (this) properly',() => {

			it('Invocation', () => {

				return new Promise( async (res, rej) => {

					const result = await Instance.fnf.invoke('fnf_test_3');
					assert(_realObject(result), 'result was not an object');
					assert(result.success === true, 'did not indicate success');

					//give some time for the queue to respond (FnF doesnt acknowledge)
					setTimeout(e => { res(); }, 1000);
				});

			});

			it('Assertion', () => {

				const file = path.resolve(__dirname, 'mocks', 'fnftest3.text');
				const contents = fs.readFileSync(file, 'utf8');
				assert(contents, 'WrappedRabbit');
			});

			it('Cleanup', () => {

				let file = path.resolve(__dirname, 'mocks', 'fnftest3.text');
				fs.unlinkSync(file); 
			})

		});

	});

	describe('Cleans up after FnF tests', () => {

		it('Closes FnFClass1', async () => {

			const result = await ClassMock.closeRabbit();
			assert(_realObject(result), 'result was not an object');
			assert(result.success === true, 'did not indicate success');
		});

		it('Closes the DecoratedRabbit Instance', async () => {

			const result = await Instance.close();
			assert(_realObject(result), 'result was not an object');
			assert(result.success === true, 'did not indicate success');
		});

	});

});