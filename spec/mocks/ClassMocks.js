import {withRabbit, rpc, fnf, pubsub, topic} from '../../src';
import config from '../config';
import fs from 'fs';
import path from 'path';

@withRabbit(config)
export class MockClass1 {

	constructor( args ) {
		this.args = args;
	}

	someDecoratedMethod() {

	}
}

@withRabbit(config)
export class MockClass2 {

	constructor( args ) {
		this.args = args;
	}

	@rpc()
	test_rpc_method() {

		return {success:true, message:3333};
	}


	@fnf()
	testFireAndForget( args ) {

		fs.writeFileSync(path.resolve(__dirname, 'test1.json'), JSON.stringify({test:'that'}));
	}
}

@withRabbit({initialize:false})
export class MockClass3 {

	constructor( args ) {
		this.args = args;
	}

	@rpc()
	methodA() {

		return {success:true, message:'methodA'};
	}


}

@withRabbit(config)
export class TestPubSub {

	constructor( args ) {

		this.args = args;
	}

	@pubsub()
	testPubSub( args ) {

		fs.writeFileSync(path.resolve(__dirname, 'test2.json'), JSON.stringify({test: args}));
	}

}

@withRabbit(config)
export class TestTopic {

	constructor( args ) {

		this.args = args;
	}

	@topic({exchange: 'test_topic', topic:'my.topic'})
	testTopic( args ) {

		fs.writeFileSync(path.resolve(__dirname, 'my.topic.json'), JSON.stringify({test: args}));
	}

	@topic({exchange: 'test_topic', topic:'my.othertopic'})
	testTopic2( args ) {
		fs.writeFileSync(path.resolve(__dirname, 'my.othertopic.json'), JSON.stringify({test: args}));
	}

	@topic({exchange: 'test_topic', topic:'my.*'})
	testTopic3( args ) {
		fs.writeFileSync(path.resolve(__dirname, 'my.json'), JSON.stringify({test: args}));
	}

	@topic({subscribe:'test_topic:my.coolstringtopic'})
	testTopic4( args ) {

	}
}