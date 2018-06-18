import co from 'co';
import assert from 'assert';

export default class RPC {

	constructor( main ) {

		this.mq = main;
	}

	/**
	 * Provision an RPC queue listener.
	 * 
	 * @param {Object} args the argument object. 
	 */
	async provision( args ) {

		try {

			args = args || {};
			assert(args.provision, 'decorated-rabbit - rpc::provision was not argued a provision');

			let {endpoint, handler, options} = args.provision;

			options = options || {};
			options.durable = options.durable === undefined ? false : options.durable;

			assert(endpoint, 'cannot provision rpc without an endpoint (queuename)');
			assert(handler, 'cannot provision rpc without a handler function');

			let channel;

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
			
				methodargs = JSON.parse(msg.content.toString());
				response = handler(methodargs);
			
				if(response instanceof Promise)
					response = await response;
			
				channel.sendToQueue(msg.properties.replyTo, new Buffer(JSON.stringify(response)), {});

			}, {noAck: true});

			return {success:true, channel: channel, tag: cons.consumerTag };

		} catch( err ) {
			console.log('ERRRRRRRRRRRRR', err);
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
	async unprovision( args ) {

		try {

			args = args || {};
			assert(args.provision, 'decorated-rabbit - rpc::provision was not argued a provision');

			const {provision} = args;

			await provision.channel.cancel(provision.tag);
			await provision.channel.close();

			provision.provisioned = false;
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
	invoke( queue, message, options ) {

		return new Promise( async (resolve, reject) => {

			try {

				let channel, inQueue;

				channel = await this.mq.connection.createChannel();
				inQueue = await channel.assertQueue('', {exclusive:true});

				channel.consume(inQueue.queue, msg => {
					resolve(JSON.parse(msg.content.toString()));
				}, {noAck:true});

				channel.sendToQueue(queue, new Buffer(JSON.stringify(message)), {replyTo: inQueue.queue});

			} catch( err ) {

				console.log('ERrored....', err);
			}

		});

	}

}
