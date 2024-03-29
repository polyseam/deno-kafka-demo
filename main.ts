import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import {
  CompressionTypes,
  Kafka,
  Message,
  RecordMetadata,
} from "npm:kafkajs@2.2.4";

const username = Deno.env.get("KAFKA_USERNAME");
const password = Deno.env.get("KAFKA_PASSWORD");
const broker = Deno.env.get("KAFKA_BROKER");
const SASL_MECHANISM = "scram-sha-256";

function InstructionsPage() {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Roll Dice</title>
    <script>
      function updateAction() {
        const username = document.getElementById("username").value;
        const form = document.querySelector("form");
        form.action = "/roll/" + username;
      }
    </script>
  </head>
  <body>
    <h1>Roll Dice</h1>
    <form action="/roll/anonymous">
      <input type="text" id="username" onchange="updateAction()" placeholder="Enter your username" />
      <button type="submit">Roll the dice</a>
    <form>
  </body>
  </html>
  `.trim();
}

type DiceRollEvent = {
  roll: number;
  username: string;
};

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

const producer = redpanda.producer();

type EasyMsg = {
  key: string;
  value: Record<string, unknown>;
};

const sendMessage = async (
  topic: string,
  msg: EasyMsg,
): Promise<RecordMetadata[] | void> => {
  // Messages with the same key are sent to the same topic partition for
  // guaranteed ordering

  await producer.connect();

  const messages: Array<Message> = [
    {
      key: msg.key,
      value: JSON.stringify(msg.value),
    },
  ];

  const recordMetadata = await producer
    .send({
      topic,
      compression: CompressionTypes.GZIP,
      messages,
    })
    .catch((e: Error) => {
      console.error(`Unable to send message: ${e.message}`, e);
    });
  if (recordMetadata) return recordMetadata;
};

// roll dice
const rollDice = () => {
  return Math.floor(Math.random() * 6) + 1;
};

serve(async (req: Request) => {
  // setup
  const region = Deno.env.get("DENO_REGION") || "unknown";
  const roll = rollDice();
  const segments = new URL(req.url).pathname.split("/");
  const action = segments[1];
  const username = segments[2];
  const date = new Date().toISOString();

  if (segments.length !== 3 || action !== "roll") {
    return new Response(InstructionsPage(), {
      headers: {
        "content-type": "text/html",
      },
      status: 400,
    });
  }

  const value: DiceRollEvent = { roll, username, date };

  if (action === "roll") {
    const kafkaRecord = await sendMessage("roll", {
      key: region,
      value,
    });

    await producer.disconnect();

    const responseBody = {
      username,
      roll,
      region,
      date,
      kafkaRecord,
    };

    const status = kafkaRecord ? 200 : 500;

    return new Response(JSON.stringify(responseBody, null, 2), {
      headers: {
        "content-type": "application/json",
      },
      status,
    });
  }

  return new Response("Bad Request: please use /roll/:username", {
    status: 400,
  });
});
