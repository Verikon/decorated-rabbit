export default class PatternBase {

	constructor( main ) {

		this.mq = main;
	}

	/**
	 * Encode the message for the queue
	 * 
	 * @todo support more than just JSON - eg protocol buffers.
	 * @param {*} msg
	 * 
	 * @returns {Buffer} encoded message in a buffer.
	 */
	encode( msg ) {

		try {

			return new Buffer(JSON.stringify(msg));
		} catch( err ) {

			this.handle_error('Patternbase', 'encode', err, 'Failed to encode to a message buffer. Are the arguments for your queue endpoint structured correctly?');
		}
	}

	/**
	 * Decode the message from the queue.
	 * 
 	 * @todo support more than just JSON - eg protocol buffers.
	 * @param {Buffer} msg 
	 * 
	 * @returns {*} the decoded message.
	 */
	decode( msg ) {

		try {

			return JSON.parse(msg.content.toString());
		} catch( err ) {

			this.handle_error('Patternbase', 'encode', err, 'Failed to encode to a message buffer. Are the arguments for your queue endpoint structured correctly?');
		}
	}

	/**
	 * Error Handler
	 * 
	 * @param {String} pattern the pattern/class name invoking this error handler.
	 * @param {String} method the method invoking this error handler.
	 * @param {Error} error the Error instance.
	 * @param {Object} options the options object.
	 * @param {String} options.message override the default error message with this string.
	 * @param {Boolean} options.kill kill the process
	 * 
	 */
	handle_error(pattern, method, error, options) {

		options = options || {};

		let hasFriendly = this.friendlyError(error);

		console.error(options.message || 'Method `'+method+'` for pattern `'+pattern + '` has failed.');
		console.log(error.message);

		if(hasFriendly) console.log(hasFriendly.hint);
		
		if(options.kill)
			process.exit();
	}

	friendlyError( err ) {

		//durability mismatch..
		if(err.message.indexOf('406')) {

			return {
				friendly: true,
				hint: `
				***
					This can suggest:

					- you're invoking a queue with a durability mismatch, try optioning <pattern>.invoke method with a durability option
						  opposite to its default, eg. for the FNF pattern (which has a default of durability:false) try {durability: true}.

					  - you're attempting to create a new non-durable queue where a durable queue with the same name currently exists. 

					  Queue durability in depth: https://www.rabbitmq.com/queues.html#durability
				***
				`,
				code: 406
			};
		}
		
		return false;
	}

	/**
	 * log a message to the console.
	 * 
	 * @param {String} messsage the message to log if server isnt being silent. 
	 */
	logToConsole( messsage ) {


		console.log(message);
	}
}