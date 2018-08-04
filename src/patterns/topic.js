import PatternBase from './PatternBase';
import assert from 'assert';

export default class Topic extends PatternBase{

	constructor( main ) {

		super(main);
	}

	async provision({provision, context}) {

		try {

			let queue, consumer, channel;

			let {endpoint, handler} = provision;

			//extract the options, setting defaults.
			let {durable, exclusive} = provision.options;
			durable = durable === undefined ? false : durable;
			exclusive = exclusive === undefined ? true : exclusive;

			//apply the argued context
			handler = context ? handler.bind(context) : handler;

			//determine the exchange we're pubsubbing to.
			const exchange = provision.options.exchange || this.mq.exchange;
			assert(exchange, 'Could not decorate method '+provision+' endpoint with pattern `pubsub` - exchange could not be determined. Either argue a default exchange to the instance, or option an exchange in via the decorator');

			//determine the topic we're subscribing to.
			const topic = provision.options.topic || '*';
			assert(topic, 'Topic decorators require a topic. eg: @topic({topic: "my.topic"})');

			//gain a channel.
			channel = await this.mq.connection.createChannel();

			//assert the exchange
			channel.assertExchange(exchange, 'topic', {durable: durable});

			//build the queue
			queue = await channel.assertQueue('', {exclusive:exclusive});

			//bind the channel to the queue
			channel.bindQueue(queue.queue, exchange, topic);

			//set up the consumer
			consumer = await channel.consume(queue.queue, async msg => {

				let methodargs, response;
				
				methodargs = this.decode(msg);
				response = handler(methodargs);

				//retain execution if the listener is asynchronous.
				if(response instanceof Promise)
					response = await response;

			}, {noAck: true});

			return {success:true, channel: channel, tag: consumer.consumerTag};

		} catch( err ) {

			console.log('PubSub Provision failed:', err);
		}

	}

	/**
	 * 
	 * @param {String|Array|Object} message the message to publish 
	 * @param {Object} options the options object
	 * @param {String} topic the topic to publish to
	 * @param {String} exchange the exchange to publish the message to, default (instance default exchange)
	 * 
	 */
	async publish( message, topic, exchange ) {

		try {

			//gain a channel.
			const channel = await this.mq.connection.createChannel();
			
			//determine the exchange
			exchange = exchange || this.mq.exchange;
			assert(exchange, 'Could not publish message - exchange could not be determined. Option "exchange": "<ExchangeName>"');

			//assert the exchange.
			channel.assertExchange(exchange, 'topic', {durable: false});

			//publish a message
			channel.publish(exchange, topic, new Buffer(JSON.stringify(message)));

			return {success: true};

		} catch( err ) {

			console.log('PubSub publish failed:', err);
			return {success: false, error: err};
		}

	}

	async deprovision({provision}) {

		try {

			assert(provision, 'decorated-rabbit - pubsub::provision was not argued a provision');

			await provision.channel.cancel(provision.tag);
			await provision.channel.close();

			provision.provisioned = false;

			console.log('Deprovisioned PubSub::'+provision.endpoint);
			return {success: true};


		} catch( err ) {

			console.log('failed to unprovision', err);
		}
	}

}