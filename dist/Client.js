'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Client = undefined;

var _DecoratedRabbit = require('./DecoratedRabbit');

var _DecoratedRabbit2 = _interopRequireDefault(_DecoratedRabbit);

var _PatternBase = require('./patterns/PatternBase');

var _PatternBase2 = _interopRequireDefault(_PatternBase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let Client = exports.Client = class Client {

    /**
     * 
     * @param {Object} the params object
     * @param {String} uri the rabbitMQ server URI
     * @param {String} exchange a default exchange for this server
     * @param {Object} options an options object.
     * @param {Boolean} options.provision provision all imported listeners (decorated functions with @rpc etc), default false.
     */
    async connect({ uri, exchange, provision = false }) {

        this.mq = new _DecoratedRabbit2.default({ endpoint: uri, exchange });
        return await this.mq.start({ provision });
    }

    async disconnect() {

        return await this.mq.close();
    }

    message() {

        return this.mq;
    }
};