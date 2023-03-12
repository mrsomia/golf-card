import { QueryClient, useMutation } from '@tanstack/react-query'
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


export const roomDataSchema = z.object({
  room: z.object({
      id: z.number(),
      lastAccessed: z.string(),
      name: z.string(),
    }),
  user: z.object({
    id: z.number(),
    lastAccessed: z.string(),
    name: z.string(),
    roomId: z.number(),
  })
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
  par,
} : {
  userName: string;
  roomId: number;
  holeNumber: number;
  par: number;
}) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/create-hole`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body : JSON.stringify({ username: userName, roomId, holeNumber, par }),
    })
    const r = res.json()

    if (!res.ok) {
      console.error(`Error creating hole`)
      console.warn({ res, r })
      throw new Error(`Error creating hole`)
    }

    return r
  } catch (e) {
    throw e
  }
}

export const removeHole = async ({
  holeId,
  userName,
  roomId
} : {
  holeId: number;
  userName: string;
  roomId: number;
}) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/remove-hole`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body : JSON.stringify({ username: userName, roomId, holeId, }),
    })

    if (!res.ok) {
      console.error(`Error removing hole`)
      console.warn({ res })
      throw new Error(`Error removing hole`)
    }
  } catch (e) {
    throw e
  }
}

export const useRemoveHole = (queryclient: QueryClient) => useMutation({
  mutationFn: removeHole,
  onError: (err, removeHoleVariables, _context) => {
    console.error("error removing hole", { err, removeHoleVariables })
  },
  onSettled: () => {
    queryclient.invalidateQueries(["score"])
  },
})



