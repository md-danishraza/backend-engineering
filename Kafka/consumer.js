// consumer.js
const { kafka } = require("./client");
// capturing groupId using cli arguments
const group = process.argv[2];
// we can use groupId to prevent reading old messages
// if corresponding user crashes

async function init() {
  // Creating a consumer with a specific Group ID
  const consumer = kafka.consumer({ groupId: group });

  await consumer.connect();

  // Subscribing to the topic. 'fromBeginning: true' means read old data if this is a new group.
  await consumer.subscribe({ topics: ["rider-updates"], fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(
        `${group}: [${topic}]: PART:${partition}:`,
        message.value.toString()
      );
    },
  });
}

init();
