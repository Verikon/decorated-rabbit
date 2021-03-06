import {assert} from 'chai';
import fs from 'fs';
import path from 'path';

import DecoratedRabbit, {withRabbit, rpc, cte, pubsub, fnf, topic} from '../src';
import config from './config';

import {
	MockClass1,
	MockClass2,
	MockClass3,
	TestPubSub,
	TestTopic
} from './mocks/ClassMocks';

let _realObject = obj => { return (!!obj) && (obj.constructor === Object); };

describe('decorated-rabbit tests', function() {

	this.timeout('15s');

	describe('Prepartion', () => {

		describe('Test Imports', () => {

			it('DecoratedRabbit is a class', () => {

				assert(typeof DecoratedRabbit === 'function', 'not a function (classes are typed functions)');

				let test = new DecoratedRabbit();
				assert(test instanceof DecoratedRabbit, 'did not instantiate');
			});

			it('rpc is a function', () => {

				assert(typeof rpc === 'function', 'failed.');
			});

			it('cte is a function', () => {

				assert(typeof cte === 'function', 'failed.');
			});

			it('pubsub is a function', () => {

				assert(typeof pubsub === 'function', 'failed.');
			});

			it('fnf is a function', () => {

				assert(typeof fnf === 'function', 'failed.');
			});

			it('topic is a function', () => {

				assert(typeof topic === 'function', 'failed.');
			});

		});

	});

	describe('Decoration', () => {

		describe('Decorates MockClass1 -no decoration', () => {

			let ClassMock;

			describe('Invocation', () => {

				it('Instantiates the mocked class (MockClass1)', () => {

					ClassMock = new MockClass1({a:1});
					assert(ClassMock instanceof MockClass1, 'not an instance');
				});

			});

			describe('Assertions', () => {

				it('Is an instance of ClassMock1', () => {

					assert(ClassMock instanceof MockClass1, 'ClassMock expected to be an instance of ClassMock');
				});

				it('Is an instance of WrappedRabbit', () => {
	
					assert(ClassMock.constructor.name === 'WrappedRabbit', 'expected the classname to now be WrappedRabbit');
				});

				it('Contains the default mq attribute, which is an instance of DecoratedRabbit', () => {
	
					assert(ClassMock.mq instanceof DecoratedRabbit, 'the mq attribute is expected to be an instance of DecoratedRabbit');
				});

				it('Received exactly 0 provisions', () => {

					assert(ClassMock.mq.provisions.length === 0, 'Got '+ClassMock.mq.provisions.length+' provisions but expected 0');
				});

				it('Emits `connected` upon successful connection', () => {

					return new Promise((resolve, reject) => {
						ClassMock.mq.on('connected', () => { resolve(); });
					});
				});

				it('Sets the state.initialized true', () => {

					assert(ClassMock.mq.state.initialized === true, 'Instance did not indicated it was in an initalized state');
				});

				it('Constructed the ClassMock1, assigning the argued props a:1', () =>{
	
					assert(ClassMock.args.a === 1, 'class arguments did not persist');
				});

				it('Contains a closeRabbit method', () => {

					assert(typeof ClassMock.closeRabbit === 'function', 'method closeRabbit was not decorated in');
				});

			});
	
			describe('Cleanup', () => {

				it('Invokes closeRabbit', () => {

					return ClassMock.closeRabbit()
						.then(res => {
							assert(_realObject(res), 'did not get a response object');
							assert(res.success === true, 'did not indicate success');
						});

				});

			});

		});

		describe('Decorates MockClass2 - 1 rpc listener decorated', () => {

			let ClassMock;

			describe('Invocation', () => {

				it('Instantiates the mocked class (MockClass2)', () => {

					ClassMock = new MockClass2({a:2});
					assert(ClassMock instanceof MockClass2, 'not an instance');
				});

			});

			describe('Assertions', () => {

				it('Is an instance of ClassMock1', () => {

					assert(ClassMock instanceof MockClass2, 'ClassMock expected to be an instance of ClassMock');
				});

				it('Is an instance of WrappedRabbit', () => {
	
					assert(ClassMock.constructor.name === 'WrappedRabbit', 'expected the classname to now be WrappedRabbit');
				});

				it('Contains the default mq attribute, which is an instance of DecoratedRabbit', () => {
	
					assert(ClassMock.mq instanceof DecoratedRabbit, 'the mq attribute is expected to be an instance of DecoratedRabbit');
				});

				it('Emits `connected` upon successful connection', () => {

					return new Promise((resolve, reject) => {
						ClassMock.mq.on('connected', () => { resolve(); });
					});
				});

				it('Sets the state.initialized true', () => {

					assert(ClassMock.mq.state.initialized === true, 'Instance did not indicated it was in an initalized state');
				});

				it('Received exactly 2 provisions', () => {

					assert(ClassMock.mq.provisions.length === 2, 'Got '+ClassMock.mq.provisions.length+' provisions but expected 2');
					assert(ClassMock.mq.provisions[0].provisioned, 'did not flag the provision as provisioned|true');
					assert(ClassMock.mq.provisions[0].channel, 'channel was not up and running');
				});

				it('Constructed the ClassMock2, assigning the argued props a:2', () =>{
	
					assert(ClassMock.args.a === 2, 'class arguments did not persist');
				});

				it('Contains a closeRabbit method', () => {

					assert(typeof ClassMock.closeRabbit === 'function', 'method closeRabbit was not decorated in');
				});

			});
	
			describe('Cleanup', () => {

				it('Invokes closeRabbit', () => {

					return ClassMock.closeRabbit()
						.then(res => {
							assert(_realObject(res), 'did not get a response object');
							assert(res.success === true, 'did not indicate success');
						});

				});

			});

		});

		describe('Decorates MockClass3 - not initialized until later', () => {

			let ClassMock;

			describe('Invocation', () => {

				it('Instantiates the mocked class (Mockclass3)', () => {

					ClassMock = new MockClass3({a:3});
					assert(ClassMock instanceof MockClass3, 'not an instance');
				});

			});

			describe('Assertions', () => {

				it('Received exactly 1 provisions', () => {

					assert(ClassMock.mq.provisions.length === 1, 'Got '+ClassMock.mq.provisions.length+' provisions but expected 1');
				});

				it('Provision was not provisioned', () => {

					assert(ClassMock.mq.provisions[0].provisioned === false, 'did not flag the provision as provisioned|false');
				});

				it('Channel was not constructed', () => {

					assert(ClassMock.mq.provisions[0].channel === null, 'channel was running');
				});

				it('Instance was flagged as uninitialized', () => {

					assert(ClassMock.mq.state.initialized === false, 'instance stipulates its initalized');
				});

			});

			describe('Cleanup', () => {

				it('Invokes closeRabbit', () => {

					return ClassMock.closeRabbit()
						.then(res => {
							assert(_realObject(res), 'did not get a response object');
							assert(res.success === true, 'did not indicate success');
						});

				});

			});

		});

	});

	describe('Deferred Initialization', () => {

		let ClassMock;

		describe('Invocation', () => {

			it('Instantiates the mocked class (Mockclass3)', () => {

				ClassMock = new MockClass3({a:3});
				assert(ClassMock instanceof MockClass3, 'not an instance');
			});

		});

		describe('Test', () => {

			it('invokes DecoratedRabbit::initialize with the correct arguments', () =>{

				return ClassMock.mq.initialize(config)
					.then(resp => {
						assert(_realObject(resp), 'response was not an object');
						assert(resp.success === true, 'did not indicate success');
					})
			});

			it('Invokes methodA through rpc', () => {

				return ClassMock.mq.rpc.invoke('methodA', {})
					.then(resp => {
						assert(_realObject(resp), 'response was not an object');
						assert(resp.success === true, 'did not indicate success');
						assert(resp.message === 'methodA', 'did not get the method name in the message');
					})
			});

		});

		describe('Assertions', () => {

			it('Received exactly 1 provisions', () => {

				assert(ClassMock.mq.provisions.length === 1, 'Got '+ClassMock.mq.provisions.length+' provisions but expected 1');
			});

			it('Provision was set up', () => {

				assert(ClassMock.mq.provisions[0].provisioned === true, 'did not flag the provision as provisioned|true');
			});

			it('Channel was constructed and connected', () => {

				assert(ClassMock.mq.provisions[0].channel, 'channel was not running');
			});

			it('Instance is flagged as initialized', () => {

				assert(ClassMock.mq.state.initialized === true, 'instance stipulates its initalized');
			});

		});

		describe('Cleanup', () => {

			it('Invokes closeRabbit', () => {

				return ClassMock.closeRabbit()
					.then(res => {
						assert(_realObject(res), 'did not get a response object');
						assert(res.success === true, 'did not indicate success');
					});

			});

		});
	});

	describe('Patterns', () => {

		describe('RPC (remote procedure call)', () => {

			let ClassMock;

			describe('Preparation', () => {

				it('Instantiates the mocked class (MockClass2)', () => {

					return new Promise((resolve, reject) => {
						
						ClassMock = new MockClass2();
						ClassMock.mq.on('connected', () => {
							resolve();
						})
					});
				});

				it('Has provisioned the test RPC endpoint/queue', () => {

					assert(ClassMock.mq.provisions.find(prov=> { return prov.endpoint === 'test_rpc_method' && prov.provisioned; }), 'did not find the test listener');
				});

			});

			describe('Tests', () => {

				it('Invokes the test endpoint (test_rpc_method)', ()=> {

					return ClassMock.mq.rpc.invoke('test_rpc_method', {})
						.then(resp =>{
							assert(_realObject(resp), 'response was not an object');
							assert(resp.success === true, 'expected resp.success to be true');
							assert(resp.message === 3333, 'expected the message to be 3333');
						})
				});

			});

			describe('Cleanup', () => {

				it('Closes Rabbit', () => {

					return ClassMock.closeRabbit()
							.then(res => {
								assert(_realObject(res), 'did not get a response object');
								assert(res.success === true, 'did not indicate success');
							});

				});

			});

		});

		describe('FNF (fire and forget)', () => {

			let ClassMock;

			describe('Prepartion', () => {

				it('Instantiates the mocked class (MockClass3)', () => {

					return new Promise((resolve, reject) => {
						
						ClassMock = new MockClass2();
						ClassMock.mq.on('connected', () => {
							resolve();
						})
					});
				});

				it('Has provisioned the test RPC endpoint/queue', () => {

					assert(ClassMock.mq.provisions.find(prov=> { return prov.endpoint === 'test_rpc_method' && prov.provisioned; }), 'did not find the test listener');
				});
			});

			describe('Tests', () => {

				it('ClassMock has the fnf pattern', () => {

					assert(ClassMock.mq.fnf, 'fnf does not exist');
				});

				it('FNF pattern has the invoke method', () => {

					assert(typeof ClassMock.mq.fnf.invoke === 'function', 'failed.');
				});

				it('Invokes the test endpoint (testFireAndForget)', ()=> {

					return ClassMock.mq.fnf.invoke('testFireAndForget', {})
						.then(resp =>{
							assert(_realObject(resp), 'failed - response not an object');
							assert(resp.success, 'failed - did not indicate success:true');
						})
				});

				it('endpoint (testFireAndForget) wrote a file to disc', () => {

					return new Promise((res,rej) => {

						//give a second to permit the endpoint to write its file.
						setTimeout(e => {

							let loc = path.resolve(__dirname, 'mocks', 'test1.json');

							assert(fs.existsSync(loc), 'failed. test file doesnt exist');

							let contents = fs.readFileSync(loc, 'utf8');
							contents = JSON.parse(contents);

							assert(contents.test === 'that', 'did not parse Test file to JSON');

							fs.unlinkSync(loc);

							res(true);

						}, 1000);

					});

				});

			});

			describe('Cleanup', () => {

				it('Closes Rabbit', () => {

					return ClassMock.closeRabbit()
							.then(res => {
								assert(_realObject(res), 'did not get a response object');
								assert(res.success === true, 'did not indicate success');
							});

				});

			});

		});

		describe('PUBSUB (publish-subscribe)', () => {

			let ClassMock;

			describe('Preparation', () => {

				it('Instantiates the mocked class (MockClass3)', () => {

					return new Promise((resolve, reject) => {
						
						ClassMock = new TestPubSub();
						ClassMock.mq.on('connected', () => {
							resolve();
						})
					});
				});

				it('Has provisioned the test RPC endpoint/queue', () => {

					assert(ClassMock.mq.provisions.find(prov=> {return prov.endpoint === 'testPubSub' && prov.provisioned; }), 'did not find the test listener');
				});

			});

			describe('Tests', () => {

				it('Class has the pubsub pattern', () => {

					assert(ClassMock.mq.pubsub, 'pubsub does not exist');
				});

				it('PubSub pattern has the publish method', () => {

					assert(typeof ClassMock.mq.pubsub.publish === 'function', 'failed.');
				});

				it('publishes a message ', () => {

					return new Promise((resolve, reject) => {

						ClassMock.mq.pubsub.publish('testpubsubworks')
							.then(resp => {

								assert(resp.success === true, 'did not indicate success');

								setTimeout(e => {

									let loc = path.resolve(__dirname, 'mocks', 'test2.json');
									assert(fs.existsSync(loc), 'failed. test file doesnt exist');
									let contents = fs.readFileSync(loc, 'utf8');
									contents = JSON.parse(contents);
									assert(contents.test === 'testpubsubworks', 'did not parse Test file to JSON');
									fs.unlinkSync(loc);
									resolve(true);

								}, 1000)

							});

					});

				});

			});

			describe('Cleanup', () => {

				it('Closes Rabbit', () => {

					return ClassMock.closeRabbit()
							.then(res => {
								assert(_realObject(res), 'did not get a response object');
								assert(res.success === true, 'did not indicate success');
							});

				});

			});

		});

		describe('Topic (topic)', () => {

			let ClassMock;

			describe('Preparation', () => {

				it('Instantiates the mocked class (MockClass3)', () => {

					return new Promise((resolve, reject) => {
						
						ClassMock = new TestTopic();
						ClassMock.mq.on('connected', () => {
							resolve();
						})
					});
				});

				it('Has provisioned the test RPC endpoint/queue', () => {

					assert(ClassMock.mq.provisions.find(prov=> {return prov.endpoint === 'testTopic' && prov.provisioned; }), 'did not find the test listener');
				});

			});

			describe('Tests', () => {

				it('Class has the topic pattern', () => {

					assert(ClassMock.mq.topic, 'topic does not exist');
				});

				it('Topic pattern has the publish method', () => {

					assert(typeof ClassMock.mq.topic.publish === 'function', 'failed.');
				});

				it('publishes a message to my.topic', () => {

					return new Promise((resolve, reject) => {

						ClassMock.mq.topic.publish('test_topic_works', 'my.topic', 'test_topic')
							.then(resp => {

								assert(resp.success === true, 'did not indicate success');

								setTimeout(e => {

									let loc, contents;

									loc = path.resolve(__dirname, 'mocks', 'my.topic.json');
									assert(fs.existsSync(loc), 'failed. test file doesnt exist');
									contents = fs.readFileSync(loc, 'utf8');
									contents = JSON.parse(contents);
									assert(contents.test === 'test_topic_works', 'did not parse Test file to JSON');
									fs.unlinkSync(loc);

									loc = path.resolve(__dirname, 'mocks', 'my.json');
									assert(fs.existsSync(loc), 'failed. test file doesnt exist');
									contents = fs.readFileSync(loc, 'utf8');
									contents = JSON.parse(contents);
									assert(contents.test === 'test_topic_works', 'did not parse Test file to JSON');
									fs.unlinkSync(loc);

									resolve(true);

								}, 1000)

							});

					});

				});

				it('publishes a message exclusively to my.othertopic', () => {

					return new Promise((resolve, reject) => {

						ClassMock.mq.topic.publish('test_topic_works', 'my.othertopic', 'test_topic')
							.then(resp => {

								assert(resp.success === true, 'did not indicate success');

								setTimeout(e => {
									
									let loc = path.resolve(__dirname, 'mocks', 'my.othertopic.json');
									assert(fs.existsSync(loc), 'failed. test file doesnt exist');
									let contents = fs.readFileSync(loc, 'utf8');
									contents = JSON.parse(contents);
									assert(contents.test === 'test_topic_works', 'did not parse Test file to JSON');
									fs.unlinkSync(loc);
									resolve(true);

									loc = path.resolve(__dirname, 'mocks', 'my.json');
									assert(fs.existsSync(loc), 'failed. test file doesnt exist');
									contents = fs.readFileSync(loc, 'utf8');
									contents = JSON.parse(contents);
									assert(contents.test === 'test_topic_works', 'did not parse Test file to JSON');
									fs.unlinkSync(loc);

								}, 1000)

							});

					});

				});

				it('publishes a message exclusively to my.*', () => {

					return new Promise((resolve, reject) => {

						ClassMock.mq.topic.publish('test_topic_works', 'my.*', 'test_topic')
							.then(resp => {

								assert(resp.success === true, 'did not indicate success');

								setTimeout(e => {

									let loc, contents;

									loc = path.resolve(__dirname, 'mocks', 'my.json');
									assert(fs.existsSync(loc), 'failed. test file doesnt exist');
									contents = fs.readFileSync(loc, 'utf8');
									contents = JSON.parse(contents);
									assert(contents.test === 'test_topic_works', 'did not parse Test file to JSON');
									fs.unlinkSync(loc);

									loc = path.resolve(__dirname, 'mocks', 'my.topic.json')
									assert(!fs.existsSync(loc), 'failed. test file '+loc+' exists but should not');

									loc = path.resolve(__dirname, 'mocks', 'my.othertopic.json')
									assert(!fs.existsSync(loc), 'failed. test file '+loc+' exists but should not');

									resolve(true);

								}, 1000)

							});

					});

				});

			});

			describe('Cleanup', () => {

				it('Closes Rabbit', () => {

					return ClassMock.closeRabbit()
							.then(res => {
								assert(_realObject(res), 'did not get a response object');
								assert(res.success === true, 'did not indicate success');
							});

				});

			});

		});

	});

});