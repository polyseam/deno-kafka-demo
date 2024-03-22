import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { CompressionTypes, Kafka } from "npm:kafkajs";
import os from "node:os";

const password = Deno.env.get("KAFKA_PASSWORD");

const redpanda = new Kafka({
  brokers: [
    "cnuujbjiuvqvkcfi58k0.any.us-east-1.mpx.prd.cloud.redpanda.com:9092",
  ],
  ssl: {},
  sasl: {
    mechanism: "SCRAM-SHA-256",
    username: "deno-fns",
    password,
  },
});

const producer = redpanda.producer();

const sendMessage = (msg: string) => {
  return producer.send({
    topic: "test",
    compression: CompressionTypes.GZIP,
    messages: [{
      // Messages with the same key are sent to the same topic partition for
      // guaranteed ordering
      key: os.hostname(),
      value: JSON.stringify(msg),
    }],
  })
    .catch((e: { message: any }) => {
      console.error(`Unable to send message: ${e.message}`, e);
    });
};

// roll dice
const rollDice = () => {
  return Math.floor(Math.random() * 6) + 1;
};

serve((_req: Request) => {
  const diceRollResult = rollDice();
  sendMessage("roll: " + diceRollResult);
  return new Response(`you rolled ${diceRollResult}`, {});
});
