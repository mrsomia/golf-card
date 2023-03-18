import { Prisma, PrismaClient, Hole } from "@prisma/client";

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

export async function upsertUserToDb(username: string, roomId: number) {
    let user = await prisma.user.findFirst({
        where: {
            name: username
        }
    })

    if (user) {
      user = await prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          lastAccessed: new Date(),
          roomId,
        },
      })
    } else {
      user = await prisma.user.create({
        data: {
          name: username,
          lastAccessed: new Date(),
          roomId,
        }
      })
    }

    return user
}

export async function validateOrCreateUserInRoom(username: string, roomName: string){
  const room = await prisma.room.upsert({
    where: {
      name: roomName,
    },
    update: {
      name: roomName,
      lastAccessed: new Date(),
    },
    create: {
      name: roomName,
    }
  })

  const user = await upsertUserToDb(username, room.id)
  
  return { user , room }
}

export async function getRoomScore(roomName: string) {
  const roomData = await prisma.room.update({
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
    data: {
      lastAccessed: new Date()
    }
  })
  
  if (roomData === null) {
    console.error("Could not fetch room data")
    return
  }

  // This Transforms the roomData above into the format for the frontend
  
  // The changes to this section below are to ensure there is always a userScore created for each hold and user in the room
  // this should provide the frontend with the userscore id
  // making updates to the usersocre easier
  const players = roomData.users.map(async user => {
    const scoresPromises = roomData.holes.map(async hole => {
      const scoreForThisHole = user.userScores.find(userScore => userScore.holeId === hole.id)
      // This part cretes a new score if scoreForThisHole is not found
      let newScore
      if (!scoreForThisHole) {
        console.info(`Creating new score for ${user.name} in hole: ${hole.number}
                    hole ID: ${hole.id}`)
        newScore = await prisma.userScore.create({
            data: {
                holeId: hole.id,
                userId: user.id,
            }
      })

      }
      return scoreForThisHole ?? newScore
    })
    
    const scores = await Promise.all(scoresPromises)

   return {
      name: user.name,
      id: user.id,
      scores
    }
  })

  const result = {
    room: {
      id: roomData.id,
      name: roomData.name,
    },
    holes: roomData.holes,
    players: await Promise.all(players)
  }

  return result
}

export async function updatePlayerScore({
    userScoreId,
    newScore,
}: {
    userScoreId: number;
    newScore: number;
}) {
    const newUserScore = await prisma.userScore.update({
        where: {
            id: userScoreId,
        },
        data: {
            score: newScore,
            lastAccessed: new Date(),
        }
    })
    return newUserScore
}

export function findNextHoleNumber (holes: Hole[]) {
  let number = holes.length + 1
  console.log(`number: ${number}` )
  holes.sort((a,z) => a.number - z.number)
  console.log("holes")
  console.log(holes)
  for (let i = 0; i < holes.length; i++) {
    if (holes[i].number === i + 1) continue
    number = i + 1
  }
  return number
}

export async function createNewHole(roomId: number, holeNumber: number, par: number) {
  const holes = await prisma.hole.findMany({
    where: {
      roomId,
    }
  })
  
  let number = findNextHoleNumber(holes)
  console.log(`new hole number is ${number}`)
  console.log(`roomId: ${roomId}`)
  const hole = await prisma.hole.create({
    data: {
      number,
      roomId: roomId,
      par: par,
    },
    include: {
      room: {
        include: {
          users: true
        }
      }
    }
  })
  console.log("Hole")
  console.log(hole)
  if (!hole) throw Error("Unable to create hole")
  let userScores: Prisma.UserScoreCreateManyInput[] = []

  for (const user of hole.room.users) {
    userScores.push({
      userId: user.id,
      holeId: hole.id,
    })
  }


  const { count } = await prisma.userScore.createMany({
    data: userScores
  })

  if (count !== hole.room.users.length) {
    console.error(`Unable to create userscores for each user in hole: ${hole.id} in room: ${hole.room.name}`)
  }

  return hole
}

export async function removeHole(holeId: number, roomId: number) {
  // TODO: implement
  
  // remove the hole - perhaps validate the holeNumber
  const hole = await prisma.hole.delete({
    where: {
      id: holeId,
    },
  })

  // find all holes in the room with numbers greater than the holeNumber
  const holes = await prisma.hole.findMany({
    where: {
      AND:[
        {
          roomId: roomId,
        },
        {
          number: {
            gt : hole.number
          }
        }
      ]
    },
  })

  // update holes so their hole numbers are now -1
  const { count } = await prisma.hole.updateMany({
    where: {
      AND:[
        {
          roomId: roomId,
        },
        {
          number: {
            gt : hole.number
          }
        }
      ]
    },
    data: {
      number: {
        decrement: 1
      }
    }
  })

  if (holes.length !== count) {
    throw new Error("Not all holes have had their number decremented")
  }

  return
}

export async function validateUserIsInRoom(username: string, roomId: number | string) {

  let room
  if (typeof roomId === 'number') {
    room = await prisma.room.findUnique({
      where: {
        id: roomId,
      },
      include: {
        users: true
      },
    })
  } else {
    room = await prisma.room.findUnique({
      where: {
        name: roomId,
      },
      include: {
        users: true
      },
    })
  }
  
  if (!room) throw new Error("No Room Found")
  if (!room.users) throw new Error("No Users found in room")

  const user = room.users.find(user => user.name === username)

  if (!user) throw new Error("User not found in room")
    
  return user
}

export async function validateUserIdOwnsUserScore({
  userId,
  userScoreId,
}: {
  userId: number;
  userScoreId: number;
}) {
  const userScore = await prisma.userScore.findUnique({
    where: {
      id: userScoreId
    }
  })

  if (!userScore) throw new Error(`Unable to find User Score record with id ${userScoreId}`)
  
  if (userScore.userId !== userId) throw new Error(`UserID on userscore does not match given userID`)

  return userScore
}
