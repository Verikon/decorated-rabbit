import {withRabbit, rpc} from '../../src';
import config from '../config';

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