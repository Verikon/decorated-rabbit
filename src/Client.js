import DecoratedRabbit from './DecoratedRabbit';
import PatternBase from './patterns/PatternBase';

export class Client {

    async connect({uri, exchange}) {

        this.mq = new DecoratedRabbit({endpoint: uri, exchange});
        const connected = await this.mq.initialize();
    }

    message() {

        return this.mq;
    }
}