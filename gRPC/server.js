const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

// 1. Load the proto file
const PROTO_PATH = path.join(__dirname, "news.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const newsProto = grpc.loadPackageDefinition(packageDefinition).news;

// --- DUMMY DATA ---
const newsData = [
  { id: "1", title: "Note 1", body: "Content 1", postImage: "Image1.jpg" },
  { id: "2", title: "Note 2", body: "Content 2", postImage: "Image2.jpg" },
];

// 2. Implement the Service Methods
// These match the 'rpc' names in your proto file
const serverImplementation = {
  // Implements: rpc GetAllNews (Empty) returns (NewsList)
  GetAllNews: (call, callback) => {
    // call: contains the request info
    // callback: (error, response)
    console.log("Request received for GetAllNews");
    callback(null, { news: newsData });
  },

  // Implements: rpc GetNews (NewsId) returns (NewsItem)
  GetNews: (call, callback) => {
    console.log("Request received for GetNews ID:", call.request.id);

    const newsItem = newsData.find((n) => n.id === call.request.id);

    if (newsItem) {
      callback(null, newsItem);
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "Not Found",
      });
    }
  },
};

// 3. Start the Server
function main() {
  const server = new grpc.Server();

  // Add the service implementation
  server.addService(newsProto.NewsService.service, serverImplementation);

  // Bind to port
  server.bindAsync(
    "127.0.0.1:50051",
    grpc.ServerCredentials.createInsecure(), // No SSL for local dev
    (error, port) => {
      if (error) {
        console.error(error);
        return;
      }
      console.log(`Server running at http://127.0.0.1:${port}`);
      // server.start() is not needed in newer versions of grpc-js,
      // but good to know it exists for older versions.
    }
  );
}

main();
