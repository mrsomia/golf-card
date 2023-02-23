import { Prisma, PrismaClient, User } from "@prisma/client";

const prisma = new PrismaClient()

export async function deleteStaleDBItems () {
    
  console.log("Deleting old users")
  // now - (ms * s * mins * hours)
  let d = new Date(Date.now() - 1000 * 60 * 60 * 16)
  await prisma.user.deleteMany({
    where: {
      lastAccessed : {
        lte: d
      }
    }
  })
  console.log("Deleting old rooms")
  await prisma.room.deleteMany({
    where: {
      lastAccessed: {
        lte: d
      }
    }
  })
}

export async function isRoomInDB(roomName: string) {
  const room = await prisma.room.findUnique({
    where: {
      name: roomName
    }
  })
  if (room === null) return false
  return true
}


export async function addRoomToDB(roomName: string) {
  await prisma.room.create({
    data: {
      name: roomName,
    }
  })
}

export async function addUserToRoom(userName: string | User, roomName: string) {
  // may want to validate if a user exists here
  if (typeof userName === 'string') {
    const room = await prisma.room.update({
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
      include: {
        holes: true,
        users : {
          where: {
            name: {
              equals: userName,
            }
          }
        }
      }
    })

    let userScores: Prisma.UserScoreCreateManyInput[] = []

    for (const user of room.users) {
      for (const hole of room.holes) {
        userScores.push({
          userId: user.id,
          holeId: hole.id,
        })
      }
    }

    await prisma.userScore.createMany({
      data: userScores
    })
  }
}

export async function getUserFromDB(username: string) {
    const user = await prisma.user.findFirst({
        where: {
            name: username
        }
    })
    return user
}

export async function getRoomScore(roomName: string) {
  const roomData = await prisma.room.findUnique({
    where: {
      name: roomName
    },
    include: {
      holes: {
        orderBy: {
          number: 'asc',
        }
      },
      users: {
        include: {
          userScores: true
        }
      },
    },
  })
  
  if (roomData === null) {
    console.error("Could not fetch room data")
    return
  }

  // This Transforms the roomData above into the format for the frontend
  const players = roomData.users.map(user => {
    const scores = roomData.holes.map(hole => {
      const scoreForThisHole = user.userScores.find(userScore => userScore.holeId === hole.id)
      return scoreForThisHole?.score ?? 0
    })

   return {
      name: user.name,
      id: user.id,
      scores
    }
  })

  const result = {
    holes: roomData.holes,
    players,
  }

  return result
}