import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { faker } from '@faker-js/faker'

const port = process.env.PORT || 8080

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"]
  }
});

const rooms: string[] = []

const roomIo = io.of("/api/room")
roomIo.on("connection", (socket) => {
    // validate room id on joining
    socket.on('join-room', (roomId) => {
        if (roomId in rooms) {
            //Add username to room
        }
    })
  console.log(socket.id)
  socket.on('update-state', (state) => {
    socket.broadcast.emit("update-state", state)
  })
});

app.get('/', (_req, res) => res.json({ message: "hello world" }))
app.post('/create-room', (_req, res) => {
    function createRoom() {
        const words = faker.random.words(3)
        return words.replace(/ /g, '-')
    }
    let room = createRoom()
    while (rooms.includes(room)) {
        room = createRoom()
    }
    rooms.push(room)
    res.json({ room })
})

httpServer.listen(port, () => console.log(`Server is listening on port ${port}`));
