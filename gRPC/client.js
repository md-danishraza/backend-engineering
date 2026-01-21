const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

// 1. Load the proto file (Same as server)
const PROTO_PATH = path.join(__dirname, "news.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const newsProto = grpc.loadPackageDefinition(packageDefinition).news;

// 2. Create the Client Instance
const client = new newsProto.NewsService(
  "127.0.0.1:50051",
  grpc.credentials.createInsecure()
);

// 3. Make Calls
console.log("--- calling GetAllNews ---");

client.GetAllNews({}, (error, response) => {
  if (error) {
    console.error(error);
    return;
  }
  console.log("All News:", response);
});

console.log("--- calling GetNews (ID: 1) ---");

client.GetNews({ id: "1" }, (error, response) => {
  if (error) {
    console.error(error);
    return;
  }
  console.log("Single News:", response);
});
