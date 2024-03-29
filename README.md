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

5. Deploy the application using [deno deploy](https://deno.dev) by linking to
   your GitHub repository.

## usage

Visit
[redpanda-demo.deno.dev/roll/yourname](https://redpanda-demo.deno.dev/roll/anonymous)
to produce an event in the `"roll"` topic, and receive a response.
