import { EachMessagePayload, Kafka } from "npm:kafkajs@2.2.4";

const username = Deno.env.get("KAFKA_USERNAME");
const password = Deno.env.get("KAFKA_PASSWORD");
const broker = Deno.env.get("KAFKA_BROKER");
const SASL_MECHANISM = "scram-sha-256";

if (!username) {
  throw new Error("Please set the 'KAFKA_USERNAME' environment variable");
}

if (!password) {
  throw new Error("Please set the 'KAFKA_PASSWORD' environment variable");
}

if (!broker) {
  throw new Error("Please set the 'KAFKA_BROKER' environment variable");
}

const redpanda = new Kafka({
  brokers: [broker],
  ssl: {},
  sasl: {
    mechanism: SASL_MECHANISM,
    username,
    password,
  },
});

const consumer = redpanda.consumer({
  groupId: "dice-enjoyers",
});

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({
    topic: "roll",
    fromBeginning: true,
  });

  await consumer.run({
    // deno-lint-ignore require-await
    eachMessage: async (msg: EachMessagePayload) => {
      const { topic, partition, message } = msg;
      console.log();
      const topicInfo = `topic: ${topic} (${partition}|${message.offset})`;
      const messageInfo = `key: ${message.key}, value: ${message.value}`;
      console.log(`Message consumed: ${topicInfo}, ${messageInfo}`);
      console.log();
    },
  });
};

run().catch(console.error);
