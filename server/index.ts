import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const port = process.env.PORT || 8080

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000"]
  }
});

io.on("connection", (socket) => {
  console.log(socket.id)
  socket.on('update-state', (state) => {
    socket.broadcast.emit("update-state", state)
  })
});

app.get('/', (req, res) => res.json({ message: "hello world" }))

httpServer.listen(port, () => console.log(`Server is listening on port ${port}`));
