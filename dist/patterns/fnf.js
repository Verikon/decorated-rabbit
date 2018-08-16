'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = undefined;

var _PatternBase = require('./PatternBase');

var _PatternBase2 = _interopRequireDefault(_PatternBase);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Fire and Forget (FNF) pattern - the simplest patten ever.
 */
let FNF = class FNF extends _PatternBase2.default {

	constructor(main) {

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
	async provision({ context, provision }) {

		try {

			(0, _assert2.default)(provision, 'decorated-rabbit - rpc::provision was not argued a provision');
			let { endpoint, handler, options } = provision;

			//set the default provisioning options.
			options = options || {};
			options.durable = false;

			//apply the argued context
			handler = context ? handler.bind(context) : handler;

			let channel;

			//set up the endpoint/listener queue name.
			endpoint = this.mq.options.prefix_exchange ? this.mq.exchange + '.' + endpoint : endpoint;

			//gain a channel.
			channel = await this.mq.connection.createChannel();

			//assert the queue.
			await channel.assertQueue(endpoint, options);

			//set up the consumer
			let cons = await channel.consume(endpoint, async msg => {

				let methodargs = this.decode(msg);
				handler(methodargs);
			}, { noAck: true });

			this.logToConsole('Provisioned FNF::' + endpoint + ' --- ' + JSON.stringify(options), 1);
			return { success: true, channel: channel, tag: cons.consumerTag };
		} catch (err) {

			this.handle_error('FNF', 'provision', err);
		}
	}

	async deprovision(args) {

		try {

			args = args || {};
			(0, _assert2.default)(args.provision, 'decorated-rabbit - rpc::provision was not argued a provision');

			const { provision } = args;

			await provision.channel.cancel(provision.tag);
			await provision.channel.close();

			provision.provisioned = false;

			this.logToConsole('Deprovisioned FNF::' + provision.endpoint, 1);
			return { success: true };
		} catch (err) {

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
	async invoke(endpoint, args, options) {

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

			return { success: true };
		} catch (err) {

			this.handle_error('FNF', 'invoke', err);
		}
	}

};
exports.default = FNF;