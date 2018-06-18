import {EventEmitter} from 'events';

import assert from 'assert';
import AMQP from 'amqplib';

import CTE from './patterns/cte';
import RPC from './patterns/rpc';

export default class DecoratedRabbit extends EventEmitter{

	/**
	 * Constructor
	 * 
	 * @param {Object} props the class property object.
	 * @param {Array} props.provisions an array of provisions.
	 * @param {String} props.endpoint the endpoint for this decorated rabbit instance.
	 * @param {String} props.exchange a default exchange for this decorated rabbit instance.
	 * @param {Boolean} props.prefix_exchange add the exchange to all listeners as a prefix, eg 'myproject.<methodname>' instead of just '<methodname>' on the queue.
 	 * 
	 * @returns {DecoratedRabbit}
	 */
	constructor( props ) {

		props = props || {};
		super(props);

		const {provisions, exchange, endpoint, prefix_exchange} = props;

		this.connection = null;
		this.provisions = provisions || [];
		this.endpoint = endpoint || null;
		this.exchange = exchange || null;

		this.options = {
			prefix_exchange: (prefix_exchange || false)
		};

		this.state = {
			connected: false
		};

	}

	/**
	 * Initialize the instance.
	 * 
	 * @param {Object} args the argument object
	 * @param {String} args.endpoint the endpoint to connect to.
	 */ 
	async initialize( args ) {

		try {

			let {endpoint} = args;

			this.endpoint = endpoint || this.endpoint;

			//add the patterns.
			this.cte = new CTE(this);
			this.rpc = new RPC(this);

			let connected = await this.connect({context: context});

			assert(connected.success, 'Initialization failed');

			return {
				success: true,
				message: 'decorated-rabbit initialized'
			};

		} catch( err ) {

			this.handleError('initialize', err, true);
		}

	}

	/**
	 * Connect the Instance to the configured RabbitMQ instance.
	 * 
	 * @returns {Promise} resolves with {success: true, message: <string>} 
	 */
	async connect() {

		let {endpoint} = this;

		try {
			
			let result, method;

			this.connection = await AMQP.connect(endpoint);
			this.state.connected = true;

			if(this.provisions && this.provisions.length)
				await this.provision();

			this.emit('connected');

			return {
				success: true,
				message: 'MQ Connected on ' + endpoint
			};

		} catch( err ) {

			return this.handleError('connect', err);
		}

	}

	/**
	 * Disconnect the Instance to the configured RabbitMQ instance.
	 * 
	 * @returns {Promise} resolves with {success: true} and {success:false, error: Error} on failure.
	 */
	async disconnect( args ) {

		try {

			const channelDCs = this.provisions.map(prov => {
				return this[prov.type].unprovision({provision: prov});
			});

			await Promise.all(channelDCs);

			if(this.connection) {

				await this.connection.close();
			}

			return {success:true};

		} catch( err ) {

			return this.handleError('disconnect', err)
		}

	}

	/**
	 * Provisions all registered decorators.
	 * 
	 * @param {Object} args the argument object
	 * @param {Object} args.provision a single provision object
	 * @param {Array} args.provisions an array of provisions
	 * 
	 * @returns {Promise} resolves with {success: true} else on error : {success:false, error: Error}
	 */
	async provision( args ) {

		args = args || {};

		let {provisions, provision} = args;

		if(provisions || provision)
			provisions = provisions || [provision];

		if(provisions)
			this.provisions = this.provisions.concat(provisions || [provision]);

		const provision_proc = this.provisions.map(async prov => {

			//commented to leave the intent that I'd like to ensure the handler is the class members method.
			//if(this[prov.endpoint] !== prov.handler) return;
			
			try {

				if(prov.provisioned) return;

				//prov.context = args.context;			
				let result = await this[prov.type].provision({provision: prov});
				assert(result.success, 'failed to provision.');

				prov.channel = result.channel;
				prov.tag = result.tag;
				prov.provisioned = true;

			} catch( err ){
				
				return this.handleError('provision', err)
			}

		});

		await Promise.all(provision_proc);
		return {success: true};
	}

	/**
	 * Error handler.
	 * 
	 * @param {String} method the method calling this error handle.
	 * @param {Error} error the Error instance produced.
	 * @param {Boolean} kill dont return , just kill the process immediately, default: false.
	 */
	handleError( method, error, kill ) {

		if(kill){
			console.error(error);
			process.exit();
		}

		return {success:false, message: 'Method '+method+' failed.', error: error };
	}
}

