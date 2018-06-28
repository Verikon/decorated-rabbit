import PatternBase from './PatternBase';
import assert from 'assert';

/**
 * Fire and Forget (FNF) pattern - the simplest patten ever.
 */
export default class FNF extends PatternBase {

	constructor( main ) {

		super(main);
	}

	/**
	 * Fire and Forget endpoint provision
	 * 
	 * @param {Object} args the argument object
	 * @param {*} args.context a context to bind the handler to.
	 * @param {Object} args.provision
	 * 
	 * @returns {Promise}
	 */
	async provision({context, provision}) {

		try {

			assert(provision, 'decorated-rabbit - rpc::provision was not argued a provision');
			let {endpoint, handler, options} = provision;

			//set the default provisioning options.
			options = options || {};
			options.durable = false;

			let channel;

			//set up the endpoint/listener queue name.
			endpoint = this.mq.options.prefix_exchange
				? this.mq.exchange + '.' + endpoint
				: endpoint;

			//gain a channel.
			channel = await this.mq.connection.createChannel();

			//assert the queue.
			await channel.assertQueue(endpoint, options);

			//set up the consumer
			let cons = await channel.consume(endpoint, async msg => {

				let methodargs = this.decode(msg);
				handler(methodargs);

			}, {noAck: true});

			console.log('Provisioned FNF::'+endpoint+ ' --- '+JSON.stringify(options));
			return {success:true, channel: channel, tag: cons.consumerTag};

		} catch( err ) {

			this.handle_error('FNF', 'provision', err);
		}

	}

	async deprovision( args ) {

		try {

			args = args || {};
			assert(args.provision, 'decorated-rabbit - rpc::provision was not argued a provision');

			const {provision} = args;

			await provision.channel.cancel(provision.tag);
			await provision.channel.close();

			provision.provisioned = false;

			console.log('Deprovisioned FNF::'+provision.endpoint);
			return {success: true};

		} catch(err) {

			console.log('failed to unprovision', err);
		}
	}

	/**
	 * Invoke a FNF (fire and forget) endpoint
	 * 
	 * @param {String} endpoint
	 * @param {Object} args the arguments
	 * @param {Object} options the options
	 * @param {Boolean} options.durable publish to a durable queue , default false.
	 * 
	 * @returns {Promise} {success:true}
	 */
	async invoke( endpoint, args, options ) {

		try {

			options = options || {};
			options.durable = options.durable === undefined ? false : options.durable;

			let channel;

			//gain a channel.
			channel = await this.mq.connection.createChannel();

			//assert the queue.
			await channel.assertQueue(endpoint, options);

			//fire to the queue.
			await channel.sendToQueue(endpoint, this.encode(args));

			return {success: true};

		} catch( err ) {

			this.handle_error('FNF', 'invoke', err);
		}

	}

}