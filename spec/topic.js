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

describe('Topic Pattern Tests', function() {

	it('Runs Tests', () => {

	});

});