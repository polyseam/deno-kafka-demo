# redpanda cloud demo

This repository contains a demo of how to connect to Redpanda Cloud using the
[KafkaJS](kafka.js.org) library.

## why?

If this application can run successfully targeting redpanda cloud, we should be
confident that it will work with Strimzi clusters deployed using CNDI.

## setup

1. Create a Redpanda Cloud cluster
2. Create a topic named `"roll"`
3. Create a user with all permissions
4. Get the username, password, and broker address for the user

```bash
# .env
KAFKA_USERNAME='foo'
KAFKA_PASSWORD='iwgno4gi5oign4woian4gio4w'
KAFKA_BROKER='w4gnwi4ngoi4wn.any.us-east-1.mpx.prd.cloud.redpanda.com:9092'
```

5. Run the application

```bash
deno task serve
```

6. Visit [localhost:8000/roll/yourname](http://localhost:8000/roll/anonymous)

7. if configured correctly, you should see a response which looks like

```jsonc
{
  "username": "foo",
  "roll": 1,
  "region": "unknown",
  "date": "2024-03-29T04:05:27.324Z",
  "kafka_success": true,
  "kafka_record": [ // this part will be missing if the kafka record was not saved
    {
      "topicName": "roll",
      "partition": 0,
      "errorCode": 0,
      "baseOffset": "8",
      "logAppendTime": "-1",
      "logStartOffset": "-1"
    }
  ]
}
```
