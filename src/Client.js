import DecoratedRabbit from './DecoratedRabbit';

export class Client {

    async connect({uri, exchange}) {

        this.mq = new DecoratedRabbit({endpoint: uri, exchange});
        const connected = this.mq.initialize();
    }
}