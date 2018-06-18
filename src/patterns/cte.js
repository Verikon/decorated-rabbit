import co from 'co';
import AMQP from 'amqplib';

export default class CTE {

	constructor( main ) {

		this.mq = main;
	}

	invoke( queue, message, options ) {

		return co( function*() {

			var pubchannel,
				exchange;

			options = options || {};
			options.durable = options.durable === undefined ? false : options.durable;

			exchange = this.mq.config.exchange;

			pubchannel = yield this.mq.conn.createChannel();

			pubchannel.assertQueue( exchange + '.' + queue, {durable: options.durable });
			pubchannel.sendToQueue( exchange + '.' + queue, new Buffer( JSON.stringify(message) ));

		}.bind(this));

	}

	publish( queue, message ) {

		return co( function*() {

			var pubchannel,
				exchange;

			exchange = this.mq.config.exchange;
			pubchannel = yield this.mq.conn.createChannel();
			pubchannel.assertExchange(exchange, 'topic');
			pubchannel.publish(exchange, queue, new Buffer(JSON.stringify(message)) );

		}.bind(this) );
	}

	subscribe( queue, listener, options ) {

		return co( function*() {

			var subchannel,
				subqueue,
				exchange,
				wrapper;

			options = options || {};
			options.json = options.json === undefined ? true : options.json;

			exchange = this.mq.config.exchange;

			wrapper = function( msg ) {

				var content = msg.content.toString();

				if(content.indexOf('NaN') !== -1)
					console.log('Warning:::: NaN was found in JSON message payload')
				content = content.replace(/NaN/g, 0);

				var cont = options.json
					? JSON.parse( content )
					: content;

				listener(cont);
			}


			subchannel = yield this.mq.conn.createChannel();

			subchannel.assertExchange(exchange, 'topic');
			subqueue = yield subchannel.assertQueue('', {exclusive:true});

			subchannel.bindQueue(subqueue.queue, exchange, queue);
			subchannel.consume(subqueue.queue, wrapper, {noAck:true});

		}.bind(this) );
	}

	unsubscribe( queue ) {

	}
}
