import {
  CompressionTypes,
  Kafka,
  Message,
  RecordMetadata,
} from "npm:kafkajs@2.2.4";

const HTTP_CODES = {
  OK: 200,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
};

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
const rollDice = (sides = 6) => {
  return Math.floor(Math.random() * sides) + 1;
};

Deno.serve(async (req: Request) => {
  // Deno cloud populated region of the world
  const region = Deno.env.get("DENO_REGION") || "unknown";

  // the URL of the current HTTP Request
  const url = new URL(req.url);

  // everything segment after the hostname
  const segments: Array<string> = url.pathname.split("/"); // ideally ["roll", "username"];

  const action = segments[1]; // ideally "roll"
  const username = segments[2]; // ideally "username"
  const date = new Date().toISOString(); // eg. "2021-09-01T12:00:00.000Z"

  // the user doesn't know what they're doing, show instructions
  const shouldDisplayInstructions = segments.length !== 3 || action !== "roll";

  if (shouldDisplayInstructions) {
    return new Response(InstructionsPage(), {
      headers: {
        "content-type": "text/html",
      },
      status: HTTP_CODES.BAD_REQUEST,
    });
  }

  // things seem good - get a random number between 1 and 6
  const roll = rollDice();

  // create a JSON object, the body of the Kafka Message
  const value: DiceRollEvent = { roll, username }; // eg. "{"roll": 4, "username": "alice"}"

  // send the message to the Kafka "roll" topic
  const TOPIC_NAME = "roll";
  const kafka_record = await sendMessage(TOPIC_NAME, {
    key: region,
    value,
  });

  // after sending the message, disconnect the producer
  await producer.disconnect();

  // if there is a record from kafka, this will be `true`
  const kafka_success = !!kafka_record;

  // create a response body to send to the user who made the request
  const responseBody = {
    username,
    roll,
    region,
    date,
    kafka_success,
    kafka_record,
  };

  // the status of the request should be "OK" if the Kafka message was stored successfully
  // otherwise, the status should be "INTERNAL_SERVER_ERROR"
  const status = kafka_success
    ? HTTP_CODES.OK
    : HTTP_CODES.INTERNAL_SERVER_ERROR;

  return new Response(JSON.stringify(responseBody, null, 2), {
    headers: {
      "content-type": "application/json",
    },
    status,
  });
});
