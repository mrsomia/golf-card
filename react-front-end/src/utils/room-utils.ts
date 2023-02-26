import { z } from 'zod'

export const scoreSchema = z.object({
  room: z.object({
    id: z.number(),
    name: z.string(),
  }),
  holes: z.array(z.object({
    number: z.number(),
    par: z.number(),
    id: z.number(),
    roomId: z.number(),
    lastAccessed: z.string(),
  })),
  players: z.array(z.object({
    name: z.string(),
    id: z.number(),
    scores: z.array(
      z.object({
        id: z.number(),
        holeId: z.number(),
        userId: z.number(),
        score: z.number(),
        lastAccessed: z.string(),
      })
    ),
  }))
})

export const scoreQueryFn = async (username: string, roomName: string) => {
  try{
    const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/room-score/${roomName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body : JSON.stringify({ username }),
    })
    const r = await res.json()

    if(!res.ok) {
      console.log({ res, r })
      throw new Error(`Unable to complete fetch, response status was: ${res.status}`)
    }

    const validatedScore = scoreSchema.parse(r)
    return validatedScore

  } catch (e) {
    
    const err = e as Error
    console.error(e)
    throw err
  }
}
    
export const updateUserScoreFn = async ({
  userScoreId,
  userId,
  score,
} : {
  userScoreId: number;
  userId: number;
  score: number;
}) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/update-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body : JSON.stringify({ userScoreId, userId, score }),
    })
    const r = res.json()

    if (!res.ok) {
      console.error(`Error updating Score`)
      console.warn({ res, r })
      throw new Error(`Error updating Score`)
    }

    return r
  } catch (e) {
    throw e
  }
}


export const createHoleFn = async ({
  userName,
  roomId,
  holeNumber,
} : {
  userName: string;
  roomId: number;
  holeNumber: number;
}) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/create-hole`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body : JSON.stringify({ userName, roomId, holeNumber }),
    })
    const r = res.json()

    if (!res.ok) {
      console.error(`Error updating Score`)
      console.warn({ res, r })
      throw new Error(`Error updating Score`)
    }

    return r
  } catch (e) {
    throw e
  }
}
