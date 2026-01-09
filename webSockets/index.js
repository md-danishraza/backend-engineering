const http = require("http");
const express = require("express");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
// new server for socket
const io = new Server(server);

// socket events
io.on("connection", (socket) => {
  //   console.log("New client connected" + socket.id);
  socket.on("chat message", (chatMessage) => {
    io.emit("message", chatMessage);
  });
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile("/public/index.html");
});
server.listen(8000, () => {
  console.log("Server is running at http://localhost:8000");
});
