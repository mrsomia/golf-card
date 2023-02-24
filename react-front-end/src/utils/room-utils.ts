import { z } from 'zod'

export const scoreSchema = z.object({
  holes: z.array(z.object({
    number: z.number(),
    par: z.number(),
    id: z.number(),
    roomId: z.number(),
    lastAccessed: z.date(),
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

export const scoreQueryFn = async (username: string, roomName: string): Promise<z.infer<typeof scoreSchema>> => {
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
          return r
        } else {
          throw new Error("Unable to fetch")
        }
      } catch (e) {
        console.error(e)
        throw new Error("didn't fetch")
      }
    }