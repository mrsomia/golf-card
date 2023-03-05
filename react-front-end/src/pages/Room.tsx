import { useState, useEffect} from "react"
import { useLoaderData, useNavigate, useParams } from "react-router-dom"
import { createHoleFn, removeHole, roomDataSchema, scoreQueryFn, scoreSchema, updateUserScoreFn, useRemoveHole } from "../utils/room-utils"
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

    const [deletingHole, setDeletingHole] = useState(0)

    useEffect(() => {
      localStorage.setItem("connectedGolfRoom", JSON.stringify(roomAndUser))
    }, [roomAndUser])

    const queryClient = useQueryClient()
    const roomQuery = useQuery({
      queryKey: ['room'], 
      queryFn: () => scoreQueryFn(roomAndUser.user.name, roomAndUser.room.name),
      select: roomData => roomData.room,
    })

    const holeQuery = useQuery({
      queryKey: ['holes'], 
      queryFn: () => scoreQueryFn(roomAndUser.user.name, roomAndUser.room.name),
      select: roomData => roomData.holes,
    })

    const playerQuery = useQuery({
      queryKey: ['players'], 
      queryFn: () => scoreQueryFn(roomAndUser.user.name, roomAndUser.room.name),
      select: roomData => roomData.players,
    })

    const scoreMutation = useMutation({
      mutationFn: updateUserScoreFn,
      onMutate: async ({ userScoreId, userId, score }) => {
        await queryClient.cancelQueries({ queryKey: ["players"] })
        const previousState = queryClient.getQueryData(["players"])

        queryClient.setQueryData(["players"], (old: unknown)  => {
          let players
          try{
            players = scoreSchema.shape.players.parse(old)
          } catch (e) {
            return old
          }
          if (players[0].name !== roomAndUser.user.name) {
            console.error("First player is not the current user")
            return players
          }
          const oldUserScoreIndex = players[0].scores.findIndex(score => score.id === userScoreId)
          if ( oldUserScoreIndex < 0 ) return players
          players[0].scores[oldUserScoreIndex].score = score
          return { players }
        })

        return { previousState }
      },
      onError: (err, scoreVariables, context) => {
        if (context) {
          queryClient.setQueryData(["players"], context.previousState)
        }
      },
      onSettled: () => queryClient.invalidateQueries(["players"])
    })
  
    const createHoleMutation = useMutation({
      mutationFn: createHoleFn,
      onMutate: async ({ userName, roomId, holeNumber, par }) => {
        await queryClient.cancelQueries(["holes"])

        const previousStateHoles = queryClient.getQueryData(["holes"])

        queryClient.setQueryData(["holes"], (old: unknown) => {
          let holes
          try {
            holes = scoreSchema.shape.holes.parse(old)
          } catch (e) {
            return old
          }
          holes.push({
            number: holeNumber,
            roomId,
            id: 99999999,
            par,
            lastAccessed: (new Date()).toISOString(),
          })

          return holes
        })

        return { previousStateHoles }
      },
      onSuccess: () => {
        queryClient.invalidateQueries(["holes"])
        queryClient.invalidateQueries(["players"])
        queryClient.invalidateQueries(["score"])
      }
    })

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
    if (!roomQuery.data) {
      console.error("Unable to find roomQuery data")
      return
    }
    createHoleMutation.mutate({
      userName: roomAndUser.user.name,
      holeNumber: holeQuery.data?.at(-1)?.number ?? 0 + 1,
      roomId: roomQuery.data.id,
      par: newPar
    })
    setNewPar(0)
    setCreatingHole(false)
  }

  return <>
    <div
      className='flex flex-col md:justify-center items-center w-screen min-h-screen
      bg-gray-800 text-stone-300 gap-8'
    >
      <h1 
        className='text-4xl md:text-3xl font-extrabold md:font-bold m-8 text-center'
      >
        {`${roomName && roomName.replace(/-/g, " ")}`}
      </h1>

      <div className="">
        <table className="text-center table-auto">
          <thead className="">
            <tr className="text-xl">
              <th className="p-2">Holes</th>
              <th className="p-2">Par</th>
              {playerQuery.isSuccess && playerQuery.data.map(player => (
                <th className="p-2" key={player.id}>{player.name}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {holeQuery.isSuccess && holeQuery.data.map((hole, i) => (
              <tr className="text-lg" key={hole.id}>
                <td>{hole.number}</td>
                <td>{hole.par}</td>
                {playerQuery.isSuccess && playerQuery.data.map((player, j) => (
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
                  onClick={() => removeHole.mutate({
                    holeId: hole.id,
                    userName: roomAndUser.user.name,
                    roomId: roomAndUser.room.id,
                  })}
                >
                  X
                </td>
              </tr>
            ))}

            {creatingHole && holeQuery.data && (
              <tr>
                <td>{(holeQuery.data?.at(-1)?.number ?? 0) + 1}</td>
                <td>
                  <input 
                      className="bg-gray-800 w-16 text-center"
                      onChange={(e) => setNewPar(Number(e.target.value))}
                      value={newPar || ""}
                      type="number"
                      />
                </td>
                <td className="py-4" colSpan={999}>
                  <
                    button 
                    className="text-center p-2 px-3"
                    onClick={handleAddHole}
                  >
                    Add
                  </button>
                </td>
              </tr>
            )}

            <tr className="text-lg py-2">
              <td className="py-4">Total</td>
              <td></td>
              {playerQuery.isSuccess && playerQuery.data.map(player => (
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

    </div>
    </>
}

export default Room

