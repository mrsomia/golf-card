import { z } from 'zod'

const scoreSchema = z.object({
  holes: z.array(z.object({
    number: z.number(),
    par: z.number(),
  })),
  players: z.array(z.object({
    name: z.string(),
    scores: z.array(z.number()),
  }))
})

export type InitialState = {} | z.infer<typeof scoreSchema>

export const initialState: InitialState = {}

export function roomReducer(state: InitialState, action: ACTIONTYPE) {
  switch (action.type) {
    case 'UPDATE-SCORES-SERVER':
      return action.payload
    default:
      return state
  }
}

export type ACTIONTYPE = | { type: 'UPDATE-SCORES-SERVER', payload: z.infer<typeof scoreSchema> }


