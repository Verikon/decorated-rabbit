import {assert} from 'chai';
import fs from 'fs';
import path from 'path';

import {Client, topic} from '../src';
import config from './config';

import {
	MockClass1,
	MockClass2,
	MockClass3,
	TestPubSub,
	TestTopic
} from './mocks/ClassMocks';

let _realObject = obj => { return (!!obj) && (obj.constructor === Object); };

let client;

describe('Topic Pattern Tests', function() {

	describe(`Preliminaries`, () => {

		it(`Instantiates the decorated rabbit client`, async () => {

			client = new Client();
			let result = await client.connect({uri:`amqp://enterra:enterra@localhost:5672`, exchange:`ngi`});
			assert(result && result.success === true, 'failed');
		});

	});


	describe('Performs topic tests', () => {

		it(`has a provision function for topics`, () => {
			assert(typeof client.mq.topic.provision === "function", "failed");
		});

		it(`Sets up a topic listener`, () => {
			
			return new Promise( async (resolve, reject) => {

				let result = await client.mq.topic.provision({
					provision: {
						endpoint:"this.test.topic",
						handler: msg => {
							assert(msg && msg.a === 1, 'invalid message received')
							resolve(true);
						},
						options: {
							topic: "this.test.topic"
						}
					}
				});

				setTimeout(evt=>reject("failed to receive topic message"), 5000);
				let test = {a:1};
				client.mq.topic.publish(test, `this.test.topic`);

			});

		});

	});

});