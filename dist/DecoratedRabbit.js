'use strict';

Object.defineProperty(exports, "__esModule", {
			value: true
});
exports.default = undefined;

var _events = require('events');

var _isPortReachable = require('is-port-reachable');

var _isPortReachable2 = _interopRequireDefault(_isPortReachable);

var _urlParse = require('url-parse');

var _urlParse2 = _interopRequireDefault(_urlParse);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _amqplib = require('amqplib');

var _amqplib2 = _interopRequireDefault(_amqplib);

var _cte = require('./patterns/cte');

var _cte2 = _interopRequireDefault(_cte);

var _rpc = require('./patterns/rpc');

var _rpc2 = _interopRequireDefault(_rpc);

var _pubsub = require('./patterns/pubsub');

var _pubsub2 = _interopRequireDefault(_pubsub);

var _fnf = require('./patterns/fnf');

var _fnf2 = _interopRequireDefault(_fnf);

var _topic = require('./patterns/topic');

var _topic2 = _interopRequireDefault(_topic);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let DecoratedRabbit = class DecoratedRabbit extends _events.EventEmitter {

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
			constructor(props) {

						props = props || {};
						super(props);

						const { provisions, exchange, endpoint, prefix_exchange, context } = props;

						this.connection = null;
						this.provisions = provisions || [];
						this.endpoint = endpoint || null;
						this.exchange = exchange || null;
						this.defaultContext = context || null;

						this.options = {
									prefix_exchange: prefix_exchange || false
						};

						this.state = {
									connected: false,
									initialized: false
						};
			}

			/**
    * Initialize the instance.
    * 
    * @param {Object} args the argument object
    * @param {String} args.endpoint the endpoint to connect to, default ()
    * @param {String} args.exchange the exchange to construct with
    * @param {String} args.loglevel logging detail, 'silent' or a number between 1 and 5 where 5 is the maximium amount of verbosity.
    * @param {*} args.context the default context to bind all listeners to.
    */
			async initialize(args) {

						try {

									args = args || {};

									let { endpoint, exchange } = args;

									this.endpoint = endpoint || this.endpoint;
									this.exchange = exchange || this.exchange;

									this.loglevel = args.loglevel === undefined ? '1' : args.loglevel.toString();

									//add the patterns.
									this.cte = new _cte2.default(this);
									this.rpc = new _rpc2.default(this);
									this.pubsub = new _pubsub2.default(this);
									this.fnf = new _fnf2.default(this);
									this.topic = new _topic2.default(this);

									await this.awaitService(endpoint);

									let connected = await this.connect();

									(0, _assert2.default)(connected.success, 'Could not connect to MQ (' + this.endpoint + ')');

									this.state.initialized = true;

									return {
												success: true,
												message: 'decorated-rabbit initialized'
									};
						} catch (err) {

									this.handleError('initialize', err, true);
						}
			}

			/**
    * Finish up, garbage collect, end it all.
    */
			async close() {

						try {

									let result;

									//disconnect
									result = await this.disconnect();

									return { success: true };
						} catch (err) {

									return this.handleError('close', err);
						}
			}

			/**
    * Connect the Instance to the configured RabbitMQ instance.
    * 
    * @returns {Promise} resolves with {success: true, message: <string>} 
    */
			async connect() {

						let { endpoint } = this;

						try {

									let result, method;

									this.connection = await _amqplib2.default.connect(endpoint);
									this.state.connected = true;

									if (this.provisions && this.provisions.length) await this.provision();

									this.emit('connected');

									return {
												success: true,
												message: 'MQ Connected on ' + endpoint
									};
						} catch (err) {

									return this.handleError('connect', err);
						}
			}

			/**
    * Disconnect the Instance to the configured RabbitMQ instance.
    * 
    * @returns {Promise} resolves with {success: true} and {success:false, error: Error} on failure.
    */
			async disconnect(args) {

						try {

									//if this is uninitialized, return true (nothing to do/disconnect)
									if (!this.state.initialized) return { success: true };

									//deprovision all listeners
									await Promise.all(this.provisions.map(prov => {
												return this[prov.type].deprovision({ provision: prov });
									}));

									//kill the connection
									await this.connection.close();

									return { success: true };
						} catch (err) {

									return this.handleError('disconnect', err);
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
			async provision(args) {

						args = args || {};

						let { provisions, provision } = args;

						if (provisions || provision) provisions = provisions || [provision];

						if (provisions) this.provisions = this.provisions.concat(provisions || [provision]);

						const provision_proc = this.provisions.map(async prov => {

									//commented to leave the intent that I'd like to ensure the handler is the class members method.
									//if(this[prov.endpoint] !== prov.handler) return;

									try {

												if (prov.provisioned) return;

												//prov.context = args.context;			
												let result = await this[prov.type].provision({ provision: prov, context: this.defaultContext });
												(0, _assert2.default)(result.success, 'failed to provision.');

												prov.channel = result.channel;
												prov.tag = result.tag;
												prov.provisioned = true;
									} catch (err) {

												return this.handleError('provision', err);
									}
						});

						await Promise.all(provision_proc);
						return { success: true };
			}

			/**
    * Error handler.
    * 
    * @param {String} method the method calling this error handle.
    * @param {Error} error the Error instance produced.
    * @param {Boolean} kill dont return , just kill the process immediately, default: false.
    */
			handleError(method, error, kill) {

						if (kill) {
									console.error(error);
									process.exit();
						}

						return { success: false, message: 'Method ' + method + ' failed.', error: error };
			}

			awaitService(endpoint, props = {}) {

						return new Promise(async (resolve, reject) => {

									const { hostname, port } = (0, _urlParse2.default)(endpoint, true);

									const initialAttempt = await (0, _isPortReachable2.default)(port, { host: hostname });
									if (initialAttempt) return resolve(true);

									const retries = props.retries || 25;
									let retry = 0;

									const timer = setInterval(async _ => {

												const reply = await (0, _isPortReachable2.default)(port, { host: hostname });

												if (reply) {

															clearInterval(timer);
															console.log(`MQ is spinning up, waiting 20 seconds for it to be accessible.`);
															await new Promise(r => setTimeout(_ => r(), 20000)); //wait 5 seconds for the service to be ready.
															resolve(true);
												} else {

															console.log(`Awaiting MQ on ${hostname}:${port}.... attempt (${retry}/${retries})`);
															retry++;

															if (retry === retries) {
																		console.log(`MQ ${hostname}:${port} unreachable after ${retries} attempts.`);
																		reject(`Failed to reach MQ ${hostname}:${port}`);
															}
												}
									}, 3000);
						});

						const timer = setTimeout(async _ => {
									const reply = await (0, _isPortReachable2.default)(port, { host: hostname });
									if (reply) {
												clearTimeout;
									}
						}, 3000);
			}
};
exports.default = DecoratedRabbit;