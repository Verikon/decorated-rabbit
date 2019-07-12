import DecoratedRabbit from './DecoratedRabbit';
import PatternBase from './patterns/PatternBase';

export class Client {

    /**
     * 
     * @param {Object} the params object
     * @param {String} uri the rabbitMQ server URI
     * @param {String} exchange a default exchange for this server
     * @param {Object} options an options object.
     * @param {Boolean} options.provision provision all imported listeners (decorated functions with @rpc etc), default false.
     */
    async connect({uri, exchange, provision=false}) {

        this.mq = new DecoratedRabbit({endpoint: uri, exchange});
        return await this.mq.start({provision});
    }

    message() {

        return this.mq;
    }
}