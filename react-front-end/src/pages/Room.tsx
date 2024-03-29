import { useState, useEffect} from "react"
import { useLoaderData, useNavigate, useParams } from "react-router-dom"
import { createHoleFn, roomDataSchema, scoreQueryFn, scoreSchema, updateUserScoreFn, useRemoveHole } from "../utils/room-utils"
import { z } from 'zod'

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'


function Room() {
    const { roomId: roomName } = useParams()
    const navigate = useNavigate()

    const loaderData = useLoaderData()
    let roomAndUser: z.infer<typeof roomDataSchema>
    try {
      roomAndUser = roomDataSchema.parse(loaderData)
    } catch (e) {
      console.error(e)
      navigate(`/join-room`)
      throw new Error("No Room name/username provided")
    }

    const [creatingHole, setCreatingHole] = useState(false)
    const [newPar, setNewPar] = useState(0)

    type TDeleteingHole = {
        holeId: number;
        userName: string;
        roomId: number;
        number: number;
    }

    const [deletingHole, setDeletingHole] = useState<TDeleteingHole>({
      holeId: 0,
      userName: '',
      roomId: 0,
      number: 0
    })

    useEffect(() => {
      localStorage.setItem("connectedGolfRoom", JSON.stringify(roomAndUser))
    }, [roomAndUser])

    const queryClient = useQueryClient()
    const scoreQuery = useQuery({
      queryKey: ['score'], 
      queryFn: () => scoreQueryFn(roomAndUser.user.name, roomAndUser.room.name),
    })

    const scoreMutation = useMutation({
      mutationFn: updateUserScoreFn,
      onMutate: async ({ userScoreId, score }) => {
        await queryClient.cancelQueries({ queryKey: ["score"] })
        const previousState = queryClient.getQueryData(["score"])

        queryClient.setQueryData(["score"], (old: unknown)  => {
          let players
          let scoreData
          try{
            scoreData = scoreSchema.parse(old)
            players = scoreData.players
          } catch (e) {
            return old
          }
          if (players[0].name !== roomAndUser.user.name) {
            console.error("First player is not the current user")
            return scoreData
          }
          const oldUserScoreIndex = players[0].scores.findIndex(score => score.id === userScoreId)
          if ( oldUserScoreIndex < 0 ) return scoreData
          scoreData.players[0].scores[oldUserScoreIndex].score = score
          return scoreData
        })

        return { previousState }
      },
      onError: (err, scoreVariables, context) => {
        console.error("Error Updating score", { err, scoreVariables })
        if (context) {
          queryClient.setQueryData(["score"], context.previousState)
        }
      },
      onSettled: () => queryClient.invalidateQueries(["score"])
    })
  
    const createHoleMutation = useMutation({
      mutationFn: createHoleFn,
      onMutate: async ({ roomId, holeNumber, par }) => {
        await queryClient.cancelQueries(["score"])

        const previousState = queryClient.getQueryData(["score"])

        queryClient.setQueryData(["score"], (old: unknown) => {
          let scoreData
          try {
            scoreData = scoreSchema.parse(old)
          } catch (e) {
            return old
          }
          scoreData.holes.push({
            number: holeNumber,
            roomId,
            id: 99999999,
            par,
            lastAccessed: (new Date()).toISOString(),
          })

          scoreData.players.forEach(player => {
            player.scores.push({
              id: 99999999,
              score: 0,
              holeId: 99999999,
              lastAccessed: (new Date()).toISOString(),
              userId: player.id
            })
          })

          return scoreData
        })

        return { previousState }
      },
      onSuccess: () => {
        queryClient.invalidateQueries(["score"])
      }
    })

  // TODO: Add optimistic updates to this mutation - maybe make that row grey?
    const removeHole = useRemoveHole(queryClient)

  const handleHoleScoreChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    userScore: z.infer<typeof scoreSchema.shape.players.element.shape.scores.element>
    ) => {
      console.log(`value: ${e.target.value}, hole: ${userScore.id}`)
      scoreMutation.mutate({
        userScoreId: userScore.id,
        userId: userScore.userId,
        score: Number(e.target.value)
      })
    }
  
  const handleAddHole = () => {
    if (!scoreQuery.data) {
      console.error("Unable to find roomQuery data")
      return
    }
    createHoleMutation.mutate({
      userName: roomAndUser.user.name,
      holeNumber: scoreQuery.data.holes.at(-1)?.number ?? 0 + 1,
      roomId: scoreQuery.data.room.id,
      par: newPar
    })
    setNewPar(0)
    setCreatingHole(false)
  }

  const handleRemoveHole = ({
      holeId,
      userName,
      roomId
    } : TDeleteingHole) => {
        removeHole.mutate({
          holeId,
          userName,
          roomId,
        })
        setDeletingHole({
          holeId: 0,
          userName: '',
          roomId: 0,
          number: 0
        })
    }

  return <>
    <div
      className='flex flex-col md:justify-center items-center max-w-screen w-screen md:min-w-fit 
      min-h-screen bg-gray-800 text-stone-300 gap-8 relative'
    >
      <h1 
        className='text-4xl md:text-3xl font-extrabold md:font-bold m-8 text-center'
      >
        <span>{`${roomName && roomName.replace(/-/g, " ")}`}</span>
      {scoreQuery.isFetching && (
        <span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 m-4 inline loading">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </span>
      )}
      </h1>

      <div className="px-4 max-w-full overflow-x-scroll">
        <table className="text-center table-auto">
          <thead className="">
            <tr className="text-xl">
              <th className="p-2">Holes</th>
              <th className="p-2">Par</th>
              {scoreQuery.isSuccess && scoreQuery.data.players.map(player => (
                <th className="p-2" key={player.id}>{player.name}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {scoreQuery.isSuccess && scoreQuery.data.holes.map((hole, i) => (
              <tr className="text-lg" key={hole.id}>
                <td>{hole.number}</td>
                <td>{hole.par}</td>
                {scoreQuery.data.players.map((player, j) => (
                  <td key={`${player.id}${hole.id}`}>
                    <input
                      className="bg-gray-800 w-16 text-center"
                      onChange={(e) => handleHoleScoreChange(e, player.scores[i])}
                      value={player.scores[i].score ?? ""}
                      disabled={j !== 0}
                      type="number"
                    />
                  </td>
                ))}
                <td 
                  className="px-2 text-center w-16 text-red-500" 
                  onClick={() => setDeletingHole({
                    holeId: hole.id,
                    userName: roomAndUser.user.name,
                    roomId: roomAndUser.room.id,
                    number: hole.number,
                  })}
                >
                  X
                </td>
              </tr>
            ))}

            {creatingHole && scoreQuery.data && (
              <tr>
                <td>{(scoreQuery.data.holes.at(-1)?.number ?? 0) + 1}</td>
                <td>
                  <input 
                      className="bg-gray-800 w-16 text-center"
                      onChange={(e) => setNewPar(Number(e.target.value))}
                      value={newPar || ""}
                      type="number"
                      />
                </td>
                <td className="py-4" colSpan={Math.max(scoreQuery.data.players.length -1, 1)}>
                  <
                    button 
                    className="text-center p-2 px-3"
                    onClick={handleAddHole}
                  >
                    Add
                  </button>
                </td>
                <td className="py-4" colSpan={1}>
                  <
                    button 
                    className="text-center p-2 px-3 text-red-500"
                    onClick={() => setCreatingHole(false)}
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            )}

            <tr className="text-lg py-2">
              <td className="py-4">Total</td>
              <td></td>
              {scoreQuery.isSuccess && scoreQuery.data.players.map(player => (
                <td key={`total${player.id}`}>{player.scores.reduce((p,v) => p + v.score, 0)}</td>
              ))}
            </tr>

            {!creatingHole && (
              <tr>
                <td colSpan={100} className="text-center py-4">
                  <button onClick={() => setCreatingHole(true)}>+ New Hole</button>
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {deletingHole.holeId > 0 && (
        <>
          <div className="bg-black opacity-50 w-screen h-screen absolute flex align-center justify-center">
          </div>
          <div
            className="bg-stone-700 w-96 max-w-lg absolute z-20 h-64
            flex flex-col justify-center align-center rounded-xl"
          >
            <h6 className="p-4 py-8 text-center w-100 text-lg">Delete hole {deletingHole.number}?</h6>
            <div className="flex justify-center align-center gap-8 m-2 my-6">
              <button
                className="p-2 px-4 rounded-xl w-32 bg-orange-800 hover:bg-orange-600
            text-stone-100"
                onClick={() => setDeletingHole({
                  roomId: 0,
                  number: 0,
                  userName: "",
                  holeId: 0,
                })}
              >Cancel</button>
              <button
                className="p-2 px-4 rounded-xl w-32 bg-orange-800 hover:bg-orange-600
            text-stone-100"
                onClick={() => {
                  handleRemoveHole(deletingHole)
                }}
              >OK</button>
            </div>
          </div>
        </>
        )
      }

    </div>
    </>
}

export default Room

