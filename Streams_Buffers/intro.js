const fs = require("fs");

// Creating a readable stream
const readableStream = fs.createReadStream("example.txt", { encoding: "utf8" });

// Handling stream events (data,end,error,finish)
readableStream.on("data", (chunk) => {
  console.log("Received chunk:", chunk);
});

readableStream.on("end", () => {
  console.log("Finished reading file.");
});

// Buffers
// Creating a buffer from a string
const buffer = Buffer.from("Hello, World!");

// Access data from the buffer
console.log(buffer);

// Convert the buffer back to a string
const string = buffer.toString();
console.log(string);
