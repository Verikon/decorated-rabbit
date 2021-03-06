import co from 'co';
import assert from 'assert';
import PatternBase from './PatternBase';

export default class RPC extends PatternBase {

	constructor( main ) {

		super(main);
	}

	/**
	 * Provision an RPC queue listener.
	 * 
	 * @param {Object} args the argument object.
	 * @param {*} args.context the context to bind the listener to. 
	 */
	async provision( args ) {

		try {

			args = args || {};
			assert(args.provision, 'decorated-rabbit - rpc::provision was not argued a provision');

			const {context} = args;
			let {endpoint, handler, options} = args.provision;

			options = options || {};
			options.durable = options.durable === undefined ? false : options.durable;

			assert(endpoint, 'cannot provision rpc without an endpoint (queuename)');
			assert(handler, 'cannot provision rpc without a handler function');

			let channel;

			//apply the argued context
			handler = context ? handler.bind(context) : handler;

			//set up the endpoint.
			endpoint = this.mq.options.prefix_exchange
				? this.mq.exchange + '.' + endpoint
				: endpoint;

			//gain a channel.
			channel = await this.mq.connection.createChannel();
			
			//assert the queue.
			channel.assertQueue(endpoint,options);

			//set up the consumer
			let cons = await channel.consume(endpoint, async msg => {
			
				let methodargs, response;
			
				methodargs = this.decode(msg);
				response = handler(methodargs);
			
				if(response instanceof Promise)
					response = await response;
			
				channel.sendToQueue(msg.properties.replyTo, this.encode(response), {});

			}, {noAck: true});

			console.log('Provisioned RPC::'+endpoint+' --- '+JSON.stringify(options));

			return {success:true, channel: channel, tag: cons.consumerTag };

		} catch( err ) {

			return {success:false, error: err};
		}
	}

	/**
	 * 
	 * @param {Object} args the argument object.
	 * @param {Object} args.provision the provision object being removed
	 * 
	 * @returns {Promise} {success:true} 
	 */
	async deprovision({provision}) {

		try {

			assert(provision, 'decorated-rabbit - rpc::provision was not argued a provision');

			await provision.channel.cancel(provision.tag);
			await provision.channel.close();

			provision.provisioned = false;

			console.log('Deprovisioned RPC::'+provision.endpoint);
			return {success: true};

		} catch(err) {

			console.log('failed to unprovision', err);
		}
	}

	/**
	 * Invoke an RPC queue listener.
	 * 
	 * @param {String} queue The queuename being published to.
	 * @param {*} message the message.
	 * @param {Object} options an options object
	 * 
	 * @returns {promise} 
	 */
	async invoke( queue, message, options ) {

		return new Promise( async (resolve, reject) => {

			try {

				let channel, inQueue;

				channel = await this.mq.connection.createChannel();
				inQueue = await channel.assertQueue('', {exclusive:true});

				channel.consume(inQueue.queue, msg => {
					resolve(this.decode(msg));
				}, {noAck:true});

				channel.sendToQueue(queue, this.encode(message), {replyTo: inQueue.queue});

			} catch( err ) {

				console.log('decorated rabbit:rpc invoke failed', err);
			}

		});

	}

}
