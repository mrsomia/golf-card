import { useEffect, useState } from "react"
import { io, type Socket } from 'socket.io-client'
import { useNavigate, useParams } from "react-router-dom"
import { scoreQueryFn, scoreSchema, updateUserScoreFn } from "../utils/room-utils"
import { z } from 'zod'

import { useQuery, useQueryClient, useMutation } from 'react-query'


function Room() {
    const { roomId: roomName } = useParams()
    const navigate = useNavigate()
    if (!roomName) {
      navigate(`/join-room`)
      throw new Error("No Room name provided")
    }
    const [socket, setSocket] = useState<null | Socket>(null)
    const [isConnected, setIsConnected] = useState<boolean | null>(socket ? socket.connected : null);
    const [creatingHole, setCreatingHole] = useState(false)
    const [newPar, setNewPar] = useState(0)
    const [username] = useState(() => {
      const localUName = localStorage.getItem("username")
      if (localUName) {
        return localUName
      } else {
        navigate(`/join-room/${roomName}`)  
        throw new Error("No username, should not reach this line")
      }
    }
    );

    const queryClient = useQueryClient()
    const scoreQuery = useQuery(['score'], () => scoreQueryFn(username, roomName))

    if (scoreQuery.data) {
      console.log({data : scoreQuery.data } )
    }

    const scoreMutation = useMutation({
      mutationFn: updateUserScoreFn,
      onMutate: async ({ userScoreId, userId, score }) => {
        await queryClient.cancelQueries({ queryKey: "score" })
        const previousState = queryClient.getQueryData("score")

        queryClient.setQueryData(["score"], (old)  => {
          let typedOld
          try{
            typedOld = scoreSchema.parse(old)
          } catch (e) {
            return old
          }
          const { holes , players } = typedOld
          if (players[0].name !== username) {
            console.error("First player is not the current user")
            return typedOld
          }
          const oldUserScoreIndex = players[0].scores.findIndex(score => score.id === userScoreId)
          if ( oldUserScoreIndex < 0 ) return typedOld
          players[0].scores[oldUserScoreIndex].score = score
          return { holes, players }
        })

        return { previousState }
      },
      onError: (err, scoreVariables, context) => {
        if (context) {
          queryClient.setQueryData(["score"], context.previousState)
        }
      },
      onSettled: () => queryClient.invalidateQueries("score")
    })

    // Sets up the socket
    useEffect(() => {
        if (!username) return
        const socket = io(`${import.meta.env.VITE_SERVER_URL}/api/room`)
        setSocket(socket)
        socket.on('connect', () => {
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        socket.emit('join-room', { roomName, username }, ({
          userId, 
          roomId, 
          userLastAccessed, 
          roomLastAccessed
        } : {
          userId: number;
          roomId: number;
          userLastAccessed: string;
          roomLastAccessed: string;
        }) => {
          window.localStorage.setItem("connectedTo", JSON.stringify({
              roomName,
              roomId,
              userId,
              userLastAccessed,
              roomLastAccessed,
            })
          )
        })

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('pong');
            socket.close()
        }
    }, [username])

  const handleHoleChange = (
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
              {scoreQuery.isSuccess && scoreQuery.data.players.map(player => (
                <th className="p-2" key={player.id}>{player.name}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {scoreQuery.isSuccess && scoreQuery.data.holes.map((hole, i) => (
              <tr className="text-lg py-2" key={hole.id}>
                <td>{hole.number}</td>
                {scoreQuery.data.players.map((player, j) => (
                  <td key={`${player.id}${hole.id}`}>
                    <input
                      className="bg-gray-800 w-16 text-center"
                      onChange={(e) => handleHoleChange(e, player.scores[i])}
                      value={player.scores[i].score ?? ""}
                      disabled={j !== 0}
                      type="number"
                    />
                  </td>
                ))}
              </tr>
            ))}
            {creatingHole && scoreQuery.data ? (
              <tr>
                <td>{(scoreQuery.data?.holes.at(-1)?.number ?? 0) + 1}</td>
                <td>
                  <input 
                      className="bg-gray-800 w-16 text-center"
                      onChange={(e) => setNewPar(Number(e.target.value))}
                      value={newPar || ""}
                      type="number"
                      />
                </td>
              </tr>
            ) : (
            <tr>
              <td colSpan={100} className="text-center">
                <button onClick={() => setCreatingHole(true)}>+ New Hole</button>
              </td>
            </tr>
            )}
          </tbody>

          <tfoot>
            <tr>
              <td>Total</td>
              {scoreQuery.isSuccess && scoreQuery.data.players.map(player => (
                <td key={`total${player.id}`}>{player.scores.reduce((p,v) => p + v.score, 0)}</td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      <span
        className={`text-lg font-medium m-4 ${!isConnected ? "text-orange-600" : ""}`}
      >
        Connected: { '' + isConnected }
      </span>
    </div>
    </>
}

export default Room

