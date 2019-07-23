import PatternBase from './PatternBase';
import assert from 'assert';

export default class Topic extends PatternBase{

	constructor( main ) {

		super(main);
		this.listeners = [];
	}

	/**
	 * Provision a topic listener
	 * 
	 * @param {Object} - the argument object
	 * @param {Object} provision
	 * @param {String} provision.endpoint the topic name
	 * @param {Function} provision.handler the listener function
	 * @param {Object} provision.options an options object
	 * @param {String} provision.options.topic the name of the topic, same as endpoitn 
	 */
	async provision({provision, context}) {

		try {

			let queue,
				consumer,
				channel;

			let {
				endpoint,
				handler
			} = provision;

			//extract the options, setting defaults.
			let {durable, exclusive} = provision.options;
			durable = durable === undefined ? false : durable;
			exclusive = exclusive === undefined ? true : exclusive;

			//apply the argued context
			handler = context ? handler.bind(context) : handler;

			if(typeof provision.options.subscribe === 'string') {
				provision.options.exchange = provision.options.subscribe.split(':')[0];
				provision.options.topic = provision.options.subscribe.split(':')[1];
			}


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

				let methodargs,
					routingKeys,
					response;

				routingKeys = msg.fields.routingKey.split('.');
				methodargs = (!!msg) && (msg.constructor === Object) ? this.decode(msg) : msg;
				response = handler(methodargs, routingKeys);

				//retain execution if the listener is asynchronous.
				if(response instanceof Promise)
					response = await response;

			}, {noAck: true});

			console.log('Provisioned Topic::'+endpoint+ ' --- '+JSON.stringify(provision.options));
			return {success:true, channel: channel, tag: consumer.consumerTag};

		} catch( err ) {

			console.log('Topic Provision failed:', err);
		}

	}

	/**
	 * 
	 * @param {String} topic the topic/pattern to listen to
	 * @param {Function} handler the handler function
	 * @param {Object} options an options object
	 * @param {String} options.exchange the exchange to publish to, default 'amq.topic'
	 * @param {String} options.parser 'json', 'protobuf' or 'string', default is string.
	 * @param {*} options.context the context in which to execute the handler.
	 */
	async listen( topic, handler, options={}) {

		const exchange = options.exchange || 'amq.topic';
		const parser = options.parser || 'string';

		//apply the handler context
		handler = options.context === undefined ? handler: handler.bind(options.context);

		//gain a channel.
		const channel = await this.mq.connection.createChannel();

		//asert the exchange
		channel.assertExchange(exchange, 'topic', {durable: false});

		//build the queue
		const queue = await channel.assertQueue('', {exclusive:true});

		//bind the channel to the queue
		channel.bindQueue(queue.queue, exchange, topic);

		//set up the consumer
		const consumer = await channel.consume(queue.queue, async msg => {

			let contents,
				parsedMessage,
				routingKeys,
				response;

			routingKeys = msg.fields.routingKey.split('.');
			contents = msg.content.toString();

			switch(parser) {
				case 'json':
					parsedMessage = JSON.parse(contents); break;
				case 'string':
					parsedMessage = contents; break;
				default:
					throw new Error(`Message received but could not be parsed, invalid parser "${parser}"`);
				
			}

			response = handler(parsedMessage, routingKeys);

		}, {noAck: true});

		//console.log('Provisioned Topic::'+endpoint+ ' --- '+JSON.stringify(provision.options));

		const reference = {
			channel: channel,
			tag: consumer.consumerTag
		}

		this.listeners.push(reference);

		return Object.assign({success:true}, reference);
	}

	/**
	 * 
	 * @param {String|Array|Object} message the message to publish 
	 * @param {Object} options the options object
	 * @param {String} topic the topic to publish to
	 * @param {String} exchange the exchange to publish the message to, default (instance default exchange)
	 * 
	 */
	async publish( message, topic, exchange, options ) {

		try {

			options = options || {};

			//gain a channel.
			const channel = await this.mq.connection.createChannel();
			
			//determine the exchange
			exchange = exchange || this.mq.exchange;
			assert(exchange, 'Could not publish message - exchange could not be determined. Option "exchange": "<ExchangeName>"');

			//assert the exchange.
			channel.assertExchange(exchange, 'topic', {durable: false});

			if(options.log) {
				console.log('Publishing to '+topic+' on exchange '+exchange+':');
				console.log('`'+JSON.stringify(message, null, 2)+'`');
			}

			//publish a message
			const result = await channel.publish(exchange, topic, new Buffer(JSON.stringify(message)));
			assert(result === true, 'Topic failed to publish to channel');
			return {success: true};

		} catch( err ) {

			console.log('Topic publish failed:', err);
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