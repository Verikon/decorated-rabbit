# decorated-rabbit

**Do not use. To experimental at this stage.**

This library provides NodeJS service applications with both a client and service library for RabbitMQ through the use of class and method decorators.

Supported message-queue patterns:

    - RPC (remote procedure call)
    - Worker
    - CTE (consumer to exchange)

It is the project goal to supply implementations for all of the RabbitMQ patterns (see https://www.rabbitmq.com/getstarted.html) but more.

## Default usage as a node service decorator
```
import {withRabbit} from 'decorated-rabbit'

@withRabbit({endpoint: 'amqp://<user>:<pass>@your_rabbit_mq:<port>', exchange: 'yourexchange'})
class MyClass {

  @rpc()
  myRPCListener( msg ) {
    return { addage: (msg.value + 1) }
  }
}
```


## Usage as a client
```
import {DecoratedRabbit} from 'decorated-rabbit';

@withRabbit({endpoint: 'amqp://<user>:<pass>@your_rabbit_mq:<port>', exchange: 'yourexchange'})
class MyClass {
  async invokeThat() {

    let response = await this.mq.rpc.invoke('myRPCListener', {value: 1});
    console.log(response); // {addage:2}
  }
}
```
