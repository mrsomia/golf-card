import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { faker } from '@faker-js/faker'
import cors from "cors";
import { scheduleJob } from 'node-schedule';
import { z } from "zod";
import morgan from 'morgan';
import { 
  deleteStaleDBItems,
  isRoomInDB,
  addRoomToDB,
  addUserToRoom,
  getRoomScore,
  getUserFromDB,
  updatePlayerScore,
  createNewHole,
  validateUserIsInRoom,
  validateUserIdOwnsUserScore,
} from "./db.js";

// Commented out for dev
// scheduleJob('*/15 * * * *', async function() {
//   deleteStaleDBItems()
// })

const port = process.env.PORT || 8080

const app = express();

app.use(cors({
  origin: "http://localhost:5173"
}))

app.use(morgan('tiny'))

app.use(express.json())

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
    socket.on('join-room', async ({ roomName, username}, onError ) => {
      // TODO: Add error handling, e.g. if username already exist?
      const promises = []

      let validatedRoom: string
      let validatedUserName: string

      try {
        validatedRoom = z.string().parse(roomName.toLowerCase())
        validatedUserName = z.string().parse(username)
      } catch (err) {
        onError(JSON.stringify(err, Object.getOwnPropertyNames(err)))
        return
      }

      // Creates a user and adds them to a room
      const user = await getUserFromDB(validatedUserName)

      if (!(await isRoomInDB(validatedRoom))) promises.push(addRoomToDB(validatedRoom))
      promises.push(addUserToRoom(user ?? validatedUserName, validatedRoom))
      promises.push(socket.join(validatedRoom))
      await Promise.allSettled(promises)

      socket.emit("Joined room", roomName)
      console.log(`${socket.id} join room: ${roomName}`)
 
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
        return words.toLowerCase().replace(/ /g, '-')
    }
    let room = createRoom()
    // TODO: Wrap promises in try/catch
    while (await isRoomInDB(room)) {
        room = createRoom()
    }
    await addRoomToDB(room)
    res.json({ room })
})

app.post("/create-hole", async (req, res) => {
  console.log(req.body)
  let userName
  let roomId
  let holeNumber
  
  // Parse/validate the input
  try {
    roomId = z.number().parse(req.body.roomId)
    holeNumber = z.number().parse(req.body.holeNumber)
    userName = z.string().parse(req.body.username)
  } catch (e) {
    res.status(400).json(e)
    return
  }
  try {
    await validateUserIsInRoom(userName, roomId)
  } catch (e) {
    res.status(403).send("Unauthorized")
    return
  }
  
  try {
    const newHole = await createNewHole(roomId, holeNumber)
    res.status(200).json(newHole)
  } catch (e) {
    res.status(503).send()
    return
  }

})

app.post("/room-score/:roomName", async (req, res) => {
  let userName: string
  let roomName: string
  try {
    userName = z.string().parse(req.body.username)
    roomName = z.string().parse(req.params.roomName)
  } catch (e) {
    res.status(400).send()
    return
  }
  try {
    await validateUserIsInRoom(userName, roomName)
  } catch (e) {
    res.status(403).send()
    return
  }

  try {
    const roomScore = await getRoomScore(roomName)
    if (!roomScore) throw (`Unable to fetch room score for: ${roomName}`)
    roomScore.players.sort((a,z) => {
      if (a.name === userName) {
        return -1
      } else if (z.name === userName) {
        return 1
      } else {
        return a.id - z.id
      }
    })
    roomScore.holes.sort((a,z) => a.number - z.number)
    console.log(roomScore)
    res.json(roomScore)
    return
  } catch (e) {
    res.status(503).send(e)
    return
  }
})

app.post("/update-score", async (req, res) => {
  let userScoreId
  let newScore
  let userId
  try {
    userScoreId = z.number().parse(req.body.userScoreId)
    newScore = z.number().parse(req.body.score)
    userId = z.number().parse(req.body.userId)
  } catch (e) {
    res.status(400).json(e)
    return
  }
  
  try {
    await validateUserIdOwnsUserScore({ userScoreId, userId })
  } catch (e) {
    res.status(403).json(e)
    return
  }

  try {
    const updatedPlayerScore = await updatePlayerScore({ userScoreId, newScore })
    res.status(200).json(updatedPlayerScore)
    return
  } catch (e) {
    res.status(503).send()
    return
  }
})

httpServer.listen(port, () => console.log(`Server is listening on port ${port}`));
