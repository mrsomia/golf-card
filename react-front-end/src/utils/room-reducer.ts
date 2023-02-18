import { z } from 'zod'

export const scoreSchema = z.object({
  holes: z.array(z.object({
    number: z.number(),
    par: z.number(),
  })),
  players: z.array(z.object({
    name: z.string(),
    scores: z.array(z.number()),
  }))
})

export type InitialState = null | z.infer<typeof scoreSchema>

export const initialState: InitialState = null

export function roomReducer(state: InitialState, action: ACTIONTYPE) {
  switch (action.type) {
    case 'UPDATE-SCORES-SERVER':
      return action.payload
    default:
      return state
  }
}

export type ACTIONTYPE = | { type: 'UPDATE-SCORES-SERVER', payload: z.infer<typeof scoreSchema> }

export const placeholderScores: z.infer<typeof scoreSchema> = {
  holes: [
    {
      number: 1,
      par: 2
    },
    {
      number: 2,
      par: 5
    },
    {
      number: 3,
      par: 3
    },
    {
      number: 4,
      par: 6
    },
    {
      number: 5,
      par: 9
    },
    {
      number: 6,
      par: 8
    },
  ],
  players: [
    {
      name: 'John',
      scores: [ 3, 5, 3, 7, 8, 7]
    },
    {
      name: 'Sam',
      scores: [ 4, 4, 5, 6, 9, 8]
    },
  ],
}

