const { kafka } = require("./client");

async function init() {
  const admin = kafka.admin();
  console.log("Admin connecting...");
  await admin.connect();
  console.log("Admin Connection Success...");

  console.log("Creating Topic");
  await admin.createTopics({
    topics: [
      {
        topic: "rider-updates",
        numPartitions: 2, // Splitting data into 2 lanes for parallel processing
      },
    ],
  });

  console.log("Topic Created Success [rider-updates]");

  console.log("Disconnecting Admin..");
  await admin.disconnect();
}

init();
