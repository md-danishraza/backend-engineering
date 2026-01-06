const { kafka } = require("./client");

async function init() {
  const producer = kafka.producer();

  console.log("Connecting Producer");
  await producer.connect();
  console.log("Producer Connected Successfully");

  //   partitioning in two (based on rider location)
  //  eg. location = north than 0 , south than 1

  //   In single group of two users each will consume different partition
  //   In single single user will consume both partition

  const name = "rahul";
  const loc = "North";

  await producer.send({
    topic: "rider-updates",
    messages: [
      {
        partition: loc === "North" ? 0 : 1,
        key: "location-update",
        value: JSON.stringify({ name, loc }),
      },
    ],
  });

  await producer.disconnect();
}

init();
