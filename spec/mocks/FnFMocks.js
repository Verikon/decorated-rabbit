import {withRabbit, fnf} from '../../src';
import config from '../config';
import fs from 'fs';
import path from 'path';

@withRabbit(Object.assign(config, {loglevel: 'silent'}))
export class FnFClass1 {

	constructor( args ) {

		this.args = args;
	}

	@fnf()
	fnf_test_1() {

		fs.writeFileSync(path.resolve(__dirname, 'fnftest1.text'), 'test');
	}

	@fnf()
	fnf_test_2( args ) {

		fs.writeFileSync(path.resolve(__dirname, 'fnftest2.json'), JSON.stringify(args,null,2));
	}

	@fnf()
	fnf_test_3( args ) {

		fs.writeFileSync(path.resolve(__dirname, 'fnftest3.text'), this.constructor.name);
	}

}