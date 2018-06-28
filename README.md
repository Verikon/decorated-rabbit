# decorated-rabbit

**Do not use. To experimental at this stage.**

This library provides NodeJS service applications with both a client and service library for RabbitMQ through the use of class and method decorators.

Supported message-queue patterns:

[RPC (remote procedure call)](https://www.enterpriseintegrationpatterns.com/patterns/messaging/EncapsulatedSynchronousIntegration.html)

[Worker (competing consumers pattern)](http://www.enterpriseintegrationpatterns.com/patterns/messaging/CompetingConsumers.html)

[FNF (fire and forget)](https://www.rabbitmq.com/tutorials/tutorial-one-javascript.html)

It is the project goal to supply implementations for all of the RabbitMQ patterns (see https://www.rabbitmq.com/getstarted.html) but more.

## Default service usage as a decorated class
```
import {withRabbit, rpc} from 'decorated-rabbit'

@withRabbit({endpoint: 'amqp://<user>:<pass>@your_rabbit_mq:<port>', exchange: 'yourexchange'})
class MyClass {

  @rpc()
  myRPCListener( msg ) {
    return { addage: (msg.value + 1) }
  }
}
```


## Default client usage as a decorated class 
```
import {withRabbit} from 'decorated-rabbit';

@withRabbit({endpoint: 'amqp://<user>:<pass>@your_rabbit_mq:<port>', exchange: 'yourexchange'})
class MyClass {

    async invokeThat() {
        let response = await this.mq.rpc.invoke('myRPCListener', {value: 1});
        console.log(response); // {addage:2}
    }
}
```

## Default client usage as a instance
```
import DecoratedRabbit from 'decorated-rabbit';

class MyClass {

    async invokeThat() {
    
        this.mq = new DecoratedRabbit({endpoint:'amqp://<user>:<pass>@your_rabbit_mq:<port>', exchange: 'yourexchange'});
        let connected = await this.mq.initialize();
    
        let response = await this.mq.rpc.invoke('myRPCListener', {value: 1});
        console.log(response); // {addage:2}
    }
}
```
