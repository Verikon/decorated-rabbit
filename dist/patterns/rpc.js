'use strict';

Object.defineProperty(exports, "__esModule", {
			value: true
});
exports.default = undefined;

var _co = require('co');

var _co2 = _interopRequireDefault(_co);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _PatternBase = require('./PatternBase');

var _PatternBase2 = _interopRequireDefault(_PatternBase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let RPC = class RPC extends _PatternBase2.default {

			constructor(main) {

						super(main);
			}

			/**
    * Provision an RPC queue listener.
    * 
    * @param {Object} args the argument object.
    * @param {*} args.context the context to bind the listener to. 
    */
			async provision(args) {

						try {

									args = args || {};
									(0, _assert2.default)(args.provision, 'decorated-rabbit - rpc::provision was not argued a provision');

									const { context } = args;
									let { endpoint, handler, options } = args.provision;

									options = options || {};
									options.durable = options.durable === undefined ? false : options.durable;

									(0, _assert2.default)(endpoint, 'cannot provision rpc without an endpoint (queuename)');
									(0, _assert2.default)(handler, 'cannot provision rpc without a handler function');

									let channel;

									//apply the argued context
									handler = context ? handler.bind(context) : handler;

									//set up the endpoint.
									endpoint = this.mq.options.prefix_exchange ? this.mq.exchange + '.' + endpoint : endpoint;

									//gain a channel.
									channel = await this.mq.connection.createChannel();

									//assert the queue.
									channel.assertQueue(endpoint, options);

									//set up the consumer
									let cons = await channel.consume(endpoint, async msg => {

												let methodargs, response;

												methodargs = this.decode(msg);
												response = handler(methodargs);

												if (response instanceof Promise) response = await response;

												channel.sendToQueue(msg.properties.replyTo, this.encode(response), {});
									}, { noAck: true });

									console.log('Provisioned RPC::' + endpoint + ' --- ' + JSON.stringify(options));

									return { success: true, channel: channel, tag: cons.consumerTag };
						} catch (err) {

									return { success: false, error: err };
						}
			}

			/**
    * 
    * @param {Object} args the argument object.
    * @param {Object} args.provision the provision object being removed
    * 
    * @returns {Promise} {success:true} 
    */
			async deprovision({ provision }) {

						try {

									(0, _assert2.default)(provision, 'decorated-rabbit - rpc::provision was not argued a provision');

									await provision.channel.cancel(provision.tag);
									await provision.channel.close();

									provision.provisioned = false;

									console.log('Deprovisioned RPC::' + provision.endpoint);
									return { success: true };
						} catch (err) {

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
			async invoke(queue, message, options) {

						return new Promise(async (resolve, reject) => {

									try {

												let channel, inQueue;

												channel = await this.mq.connection.createChannel();
												inQueue = await channel.assertQueue('', { exclusive: true });

												channel.consume(inQueue.queue, msg => {
															resolve(JSON.parse(msg.content.toString()));
												}, { noAck: true });

												channel.sendToQueue(queue, new Buffer(JSON.stringify(message)), { replyTo: inQueue.queue });
									} catch (err) {

												console.log('ERrored....', err);
									}
						});
			}

};
exports.default = RPC;