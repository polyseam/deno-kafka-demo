import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { CompressionTypes, Kafka, Message } from "npm:kafkajs@2.2.4";

const username = Deno.env.get("KAFKA_USERNAME");
const password = Deno.env.get("KAFKA_PASSWORD");
const broker = Deno.env.get("KAFKA_BROKERS");

type DiceRollEvent = {
  roll: number;
};

if (!username) {
  console.error("Please set the 'KAFKA_USERNAME' environment variable");
  Deno.exit(1);
}

if (!password) {
  console.error("Please set the 'KAFKA_PASSWORD' environment variable");
  Deno.exit(2);
}

if (!broker) {
  console.error("Please set the 'KAFKA_BROKER' environment variable");
  Deno.exit(3);
}

const redpanda = new Kafka({
  brokers: [broker],
  ssl: {},
  sasl: {
    mechanism: "scram-sha-256",
    username,
    password,
  },
});

const producer = redpanda.producer();

type EasyMsg = {
  key: string;
  value: Record<string, unknown>;
};

const sendMessage = (topic: string, msg: EasyMsg) => {
  // Messages with the same key are sent to the same topic partition for
  // guaranteed ordering
  const messages: Array<Message> = [
    {
      key: msg.key,
      value: JSON.stringify(msg.value),
    },
  ];

  return producer
    .send({
      topic,
      compression: CompressionTypes.GZIP,
      messages,
    })
    .catch((e: Error) => {
      console.error(`Unable to send message: ${e.message}`, e);
    });
};

// roll dice
const rollDice = () => {
  return Math.floor(Math.random() * 6) + 1;
};

serve((req: Request) => {
  const roll = rollDice();
  const segments = new URL(req.url).pathname.split("/");

  if (segments.length !== 3) {
    return new Response("Bad Request: please use /roll/:username", {
      status: 400,
    });
  }

  const action = segments[1];
  const username = segments[2];

  const value: DiceRollEvent = { roll };
  const date = new Date().toISOString();

  if (action === "roll") {
    sendMessage("roll", {
      key: username,
      value,
    });
    return new Response(`${username} rolled ${roll} at ${date}`, {});
  }

  return new Response("Bad Request: please use /roll/:username", {
    status: 400,
  });
});
