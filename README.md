# decorated-rabbit

**Do not use. To experimental at this stage.**

This library provides NodeJS service applications with both a client and service library for RabbitMQ through the use of class and method decorators.

Supported message-queue patterns:

[RPC (remote procedure call)](https://www.enterpriseintegrationpatterns.com/patterns/messaging/EncapsulatedSynchronousIntegration.html)

[Worker (competing consumers pattern)](http://www.enterpriseintegrationpatterns.com/patterns/messaging/CompetingConsumers.html)

[FNF (fire and forget)](https://www.rabbitmq.com/tutorials/tutorial-one-javascript.html)

[PubSub (publish-subscribe)](https://www.rabbitmq.com/tutorials/tutorial-three-javascript.html)

[Topic (topics)](https://www.rabbitmq.com/tutorials/tutorial-five-javascript.html)

It is the project goal to supply implementations for all of the RabbitMQ patterns (see https://www.rabbitmq.com/getstarted.html) but more.

## As a simple MQ client
```
import {Client as MQClient} from 'decorated-rabbit';

let result, client = MQClient();
client.connect({uri: 'amqp://someserver:<PORT>'})
	.then(_=> {
		result = await client.rpc.invoke('some_message',{a:1, b:2});
	});
```

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

## Attaching an RPC listener which will respond to the RPC queue "my_rpc_queue"
```
import {withRabbit} from 'decorated-rabbit';

@withRabbit({endpoint: 'amqp://<user>:<pass>@your_rabbit_mq:<port>', exchange: 'yourexchange'})
class MyClass {

	@rpc()
    async my_rpc_queue( args ) {
      return { addOne: (args.value + 1) }
    }
}
```

## Attaching a topic listener to the topic exchange myExchange for topic my_topic.*
### invoked from the client class as `response = await this.mq.topic.publish('my message', 'myExchange', 'my_topic.*');
```
import {withRabbit} from 'decorated-rabbit';

@withRabbit({endpoint: 'amqp://<user>:<pass>@your_rabbit_mq:<port>', exchange: 'yourexchange'})
class MyClass {

	@topic({subscribe:'myExchange:my_topic.*})
    async myTopic( msg ) {

		..do something..
    }
}
```

## Attaching an Fire and Forget listener on queue my_fnf
```
import {withRabbit} from 'decorated-rabbit';

@withRabbit({endpoint: 'amqp://<user>:<pass>@your_rabbit_mq:<port>', exchange: 'yourexchange'})
class MyClass {

	@fnf()
    async my_fnf( args ) {
      ...do something...
    }
}
```

## Attaching an Worker listener for queue work_hard
```
import {withRabbit} from 'decorated-rabbit';

@withRabbit({endpoint: 'amqp://<user>:<pass>@your_rabbit_mq:<port>', exchange: 'yourexchange'})
class MyClass {

	@worker()
    async work_hard args ) {
      ...do something...
    }
}
```
