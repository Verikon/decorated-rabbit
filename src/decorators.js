import DecoratedRabbit from './DecoratedRabbit';
import crypto from 'crypto';

let RabbitInstances = {
	default: null
};

let RabbitProvisions = {
	default: []
}

/**
 * DecoratedRabbit main decorator.
 * 
 * @param {Object} args the argument object.
 * @param {String} args.attr the attribute to apply the DecoratedRabbit instance with upon the decorated class
 * @param {String} args.instance whilst we provide a default singleton, you can run multiple instances and refer to them by name, the name set by this vairable (default is 'default' - the default singleton)
 * @param {*} args.context the default context to bind listeners to, you should never need to change this; default the class being decorated.
 */
export const withRabbit = function( args ) {

	args = args || {};

	let {instance, attr, initialize, endpoint, exchange, context} = args;

	//default initialization true.
	initialize = initialize === undefined ? true : initialize;

	//default the instance to the default singleton
	instance = instance === undefined ? 'default' : instance;

	//default the attribute to 'mq'
	attr = attr === undefined ? 'mq' : attr;

	return function( target ) {

		let id = crypto.randomBytes(16).toString("hex");

		class WrappedRabbit extends target {

			constructor( cargs ) {

				super(cargs);

				let classProvisions = RabbitProvisions[instance].filter(prov => {
					return target.prototype[prov.endpoint] === prov.handler;
				});

				//set up the default context (this.)
				context = context === undefined ? this : context;

				let provisioned_args = Object.assign({}, args, {provisions: classProvisions}, {context:context});

				if(!RabbitInstances[instance] || !(RabbitInstances[instance].inst instanceof DecoratedRabbit)) {

					RabbitInstances[instance] =  {
						inst: new DecoratedRabbit(provisioned_args),
						ids: [id]
					}
				} else {
					RabbitInstances[instance].ids.push(id);
				}

				this[attr] = RabbitInstances[instance].inst;

				if(initialize){
					this[attr].initialize(args);
				}
			}

			async closeRabbit( args ) {

				//pull the id from the list of listening classes.
				RabbitInstances[instance].ids = RabbitInstances[instance].ids.filter(iid => { return iid !== id });

				//if nothing is using this now, kill the reference so it can GC properly.
				const killInstance = !RabbitInstances[instance].ids.length;

				//disconnect the instance
				let result = await this[attr].disconnect({close: killInstance});

				if(!result.success) throw new Error('Could not close decorated-rabbit instance');

				//kill the instance, nothing is using it.
				if(killInstance) {

					//dereference the instance entirely.
					delete RabbitInstances[instance].inst;

					//delete the instance && if its the default, set it null.
					delete RabbitInstances[instance];
					if(instance === 'default') RabbitInstances.default = null;

					//tag the instance as uninitialized.
					//this[attr].props.initialized = false;
				}

				return { success: true };
			}
		}

		return WrappedRabbit;

	}

}

export const rpc = function( options ) {

	options = options || {};
	options.instance = options.instance || 'default';

	const {instance} = options;

	return function( fn, name, descriptor ) {

		RabbitProvisions[instance].push({
			type: 'rpc',
			endpoint: name,
			handler: descriptor.value,
			options: options,
			channel: null,
			provisioned: false
		});

		return descriptor.value;
	}

};

export const cte = function( options ) {

	options = options || {};
	options.instance = options.instance || 'default';

	const {instance} = options;

	return function( fn, name, descriptor ) {

		RabbitInstances[instance].provisions.push({
			type: 'cte',
			endpoint: name,
			handler: descriptor.value,
			options: options
		});

		return descriptor.value;
	}
}

/**
 * Decorate a function/method as a PubSub subscriber listener.
 * 
 * @param {Object} options the options object
 * @param {String} options.instance the rabbit instance to bind to (ie. the rabbitMQ server), default : 'default' - the default instance.
 * @param {String} options.exchange the exchange to attach pub/sub to, default: the instance default exchange. 
 */
export const pubsub = function( options ) {

	options = options || {};
	options.instance = options.instance || 'default';

	const {instance} = options;

	return function( fn, name, descriptor ) {

		RabbitProvisions[instance].push({
			type: 'pubsub',
			endpoint: name,
			handler: descriptor.value,
			options: options,
			channel: null,
			provisioned: false
		});

		return descriptor.value;

	}

};

/**
 * Decorate a function/method as a Topic listener.
 * 
 * @param {Object} options the options object
 * @param {String} options.instance the rabbit instance to bind to (ie. the rabbitMQ server), default : 'default' - the default instance.
 * @param {String} options.exchange the exchange to attach this.subscriber/listener to, default: the instance default exchange. 
 * @param {String} options.topic the topic pattern to attach this subscriber/listener to
 * @param {String} options.subscribe exhange and topic in a single string ; eg {subscribe:'myExchange:mytopic.*}.
 */
export const topic = function( options ) {

	options = options || {};
	options.instance = options.instance || 'default';

	const {instance} = options;

	return function( fn, name, descriptor ) {

		RabbitProvisions[instance].push({
			type: 'topic',
			endpoint: name,
			handler: descriptor.value,
			options: options,
			channel: null,
			provisioned: false
		});

		return descriptor.value;

	}

};

export const fnf = function( options ) {

	options = options || {};
	options.instance = options.instance || 'default';

	const {instance} = options;

	return function( fn, name, descriptor ) {

		RabbitProvisions[instance].push({
			type: 'fnf',
			endpoint: name,
			handler: descriptor.value,
			options: options,
			channel: null,
			provisioned: false
		});

		return descriptor.value;

	}
}