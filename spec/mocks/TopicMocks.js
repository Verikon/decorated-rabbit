import {withRabbit, topic} from '../../src';
import config from '../config';
import fs from 'fs';
import path from 'path';

@withRabbit(config)
export class MockClass1 {

	constructor( args ) {

		this.args = args;
	}

	@topic()
	someDecoratedMethod( args ) {

	}
}