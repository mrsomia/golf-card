import { z } from 'zod'

export const scoreSchema = z.object({
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
        console.log({ res, r })
        if (res.ok) {
          const validatedScore = scoreSchema.parse(r)
          return validatedScore
        } else {
          throw new Error(`Unable ot complete fetch, response status was: ${res.status}`)
        }
      } catch (e) {
        const err = e as Error
        console.error(e)
        throw err
      }
    }