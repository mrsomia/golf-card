import express from "express";
import { faker } from '@faker-js/faker'
import cors from "cors";
import { scheduleJob } from 'node-schedule';
import { z } from "zod";
import morgan from 'morgan';
import { 
  deleteStaleDBItems,
  isRoomInDB,
  addRoomToDB,
  getRoomScore,
  updatePlayerScore,
  createNewHole,
  validateUserIsInRoom,
  validateUserIdOwnsUserScore,
  validateOrCreateUserInRoom,
  removeHole,
} from "./db.js";

if (process.env.NODE_ENV === 'production') {
  scheduleJob('*/15 * * * *', async function() {
    deleteStaleDBItems()
  })
}

const port = process.env.PORT || 8080

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173"

app.use(cors({
  origin: FRONTEND_URL,
}))

app.use(morgan('tiny'))

app.use(express.json())

app.get('/', (_req, res) => res.json({ message: "hello world" }))

app.post("/join-room", async (req, res) => {
  let username
  let roomName
  try {
    username = z.string().parse(req.body.username)
    roomName = z.string().parse(req.body.roomName)
  } catch (e) {
    console.error("Error validating request body")
    console.error(e)
    console.info(req.body)
    res.status(400).json(e)
    return
  }

  try {
    const userAndRoom = await validateOrCreateUserInRoom(username, roomName)
    res.status(200).json(userAndRoom)
    return
  } catch (e) {
    console.error("Error Adding user to room")
    console.error(e)
    console.info(req.body)
    res.status(503).json(e)
    return
  }
})

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
  console.log("Request body")
  console.log(req.body)
  let userName
  let roomId
  let holeNumber
  let par
  
  // Parse/validate the input
  try {
    roomId = z.number().parse(req.body.roomId)
    holeNumber = z.number().parse(req.body.holeNumber)
    par = z.number().parse(req.body.par)
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
    const newHole = await createNewHole(roomId, holeNumber, par)
    res.status(200).json(newHole)
  } catch (e) {
    console.error(e)
    res.status(503).send()
    return
  }

})

app.post("/remove-hole", async (req, res) => {
  console.log("Request body")
  console.log(req.body)
  let userName
  let roomId
  // let holeNumber
  let holeId
  
  // Parse/validate the input
  try {
    roomId = z.number().parse(req.body.roomId)
    // holeNumber = z.number().parse(req.body.holeNumber)
    holeId = z.number().parse(req.body.holeId)
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
    // change return value??
    await removeHole(holeId, roomId)
    res.status(200).send()
    return
  } catch (e) {
    console.error(e)
    res.status(500).send()
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

app.listen(port, () => console.log(`Server is listening on port ${port}`));

