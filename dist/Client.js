'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Client = undefined;

var _DecoratedRabbit = require('./DecoratedRabbit');

var _DecoratedRabbit2 = _interopRequireDefault(_DecoratedRabbit);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let Client = exports.Client = class Client {

    async connect({ uri, exchange }) {

        this.mq = new _DecoratedRabbit2.default({ endpoint: uri, exchange });
        const connected = this.mq.initialize();
    }
};