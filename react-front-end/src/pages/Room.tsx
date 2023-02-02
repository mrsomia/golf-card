import { useEffect, useState } from "react"
import { io, type Socket } from 'socket.io-client'
import { useNavigate, useParams } from "react-router-dom"
import { z } from 'zod'


function Room() {
    const { roomId: roomName } = useParams()
    const [socket, setSocket] = useState<null | Socket>(null)
    const [isConnected, setIsConnected] = useState<boolean | null>(socket ? socket.connected : null);
    const [lastPong, setLastPong] = useState<null | string>(null);
    const [username, setUsername] = useState("");
    const navigate = useNavigate()

    useEffect(() => {
      const localUName = localStorage.getItem("username")
      if (localUName) {
        setUsername(localUName)
      } else {
        navigate(`/join-room/${roomName}`)  
      }
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

        socket.on('pong', () => {
            setLastPong(new Date().toISOString());
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

    const sendPing = () => {
        if (!socket) {
            console.error("Socket is not establised")
        } else {
            console.log("Sending ping")
            socket.emit('ping');
        }
    }

    const updateScore = () => {
    if (!socket) {
      console.error("Socket is not establised")
    } else {
      socket.emit('update-score', )
    }
  }

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

  const placeholderScores: z.infer<typeof scoreSchema> = {
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
              {placeholderScores.players.map(player => (
                <th className="p-2">{player.name}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {placeholderScores.holes.map((hole, i) => (
              <tr className="text-lg py-2">
                <td>{hole.number}</td>
                {placeholderScores.players.map((player) => (
                  <td>{player.scores[i]}</td>
                ))}
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td>Total</td>
              {placeholderScores.players.map(player => (
                <td>{player.scores.reduce((p,v) => p + v, 0)}</td>
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

