import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { faker } from '@faker-js/faker'
import cors from "cors";
import { scheduleJob } from 'node-schedule';
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient()

scheduleJob('0 * * * *', async function() {
  // now - (ms * s * mins * hours)
  let d = new Date(Date.now() - 1000 * 60 * 60 * 16)
  await prisma.room.deleteMany({
    where: {
      lastAccessed: {
        lte: d
      }
    }
  })
})

async function isRoomInDB(roomName: string) {
  const room = await prisma.room.findUnique({
    where: {
      name: roomName
    }
  })
  if (room === null) return false
  return true
}

async function addRoomToDB(roomName: string) {
  await prisma.room.create({
    data: {
      name: roomName,
    }
  })
}

async function addUserToRoom(userName: string, roomName: string) {
  await prisma.room.update({
    where: {
      name: roomName
    },
    data: {
      lastAccessed: new Date(),
      users: {
        create: {
          name: userName
        }
      }
    }, 
  })
}

const port = process.env.PORT || 8080

const app = express();

app.use(cors({
  origin: "http://localhost:5173"
}))

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"]
  }
});

const roomIo = io.of("/api/room")
roomIo.on("connect", (socket) => {
    // validate room id on joining
    socket.on("ping", () => {
        console.log(`Received ping from ${socket.id}`)
        socket.emit("pong")
    })
    socket.on('join-room', async ({ roomId, username }) => {
      const promises = []

      const roomZod = z.string().safeParse(roomId)
      const usernameZod = z.string().safeParse(username)

      if (roomZod.success && usernameZod.success) {
        if (!(await isRoomInDB(roomZod.data))) promises.push(addRoomToDB(roomZod.data))
        promises.push(addUserToRoom(usernameZod.data, roomZod.data))
        promises.push(socket.join(roomZod.data))
        await Promise.allSettled(promises)
        socket.emit("Joined room", roomId)
        console.log(`${socket.id} join room: ${roomId}`)
      } else if (!roomZod.success){
        console.error(roomZod.error)
        io.in(socket.id).emit('valueError', 'roomId provided must be a string')
      } else if (!usernameZod.success) {
        console.error(usernameZod.error)
        io.in(socket.id).emit('valueError', 'username must be a string')
      }
 
    })
    console.log(socket.id)
    socket.on('update-state', (state) => {
        socket.broadcast.emit("update-state", state)
    })
});

app.get('/', (_req, res) => res.json({ message: "hello world" }))
app.post('/create-room', async (_req, res) => {
    function createRoom() {
        const words = faker.random.words(3)
        return words.replace(/ /g, '-')
    }
    let room = createRoom()
    while (await isRoomInDB(room)) {
        room = createRoom()
    }
    await addRoomToDB(room)
    res.json({ room })
})

httpServer.listen(port, () => console.log(`Server is listening on port ${port}`));
