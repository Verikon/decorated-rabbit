import {withRabbit, rpc, fnf} from '../../src';
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