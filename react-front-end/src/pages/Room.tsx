import { useEffect, useState, useReducer } from "react"
import { io, type Socket } from 'socket.io-client'
import { useNavigate, useParams } from "react-router-dom"
import { initialState, placeholderScores, roomReducer } from "../utils/room-reducer"


function Room() {
    const { roomId: roomName } = useParams()
    const [socket, setSocket] = useState<null | Socket>(null)
    const [isConnected, setIsConnected] = useState<boolean | null>(socket ? socket.connected : null);
    const [lastPong, setLastPong] = useState<null | string>(null);
    const [username, setUsername] = useState("");
    const navigate = useNavigate()

    const [state, dispath] = useReducer(roomReducer, placeholderScores)

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

  const handleHoleChange = (e: React.ChangeEvent<HTMLInputElement>, holeNumber: number) => {
    console.log(`value: ${e.target.value}, hole: ${holeNumber}`)
    // TODO: This state needs to be moved to a reducer
    if (state === null) {
      console.error("state is currently null while changing score")
      return
    }
    const stateClone = { ...state }
    stateClone.players[0].scores[holeNumber] = Number(e.target.value)
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
              {state && state.players.map(player => (
                <th className="p-2">{player.name}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {state && state.holes.map((hole, i) => (
              <tr className="text-lg py-2">
                <td>{hole.number}</td>
                {state.players.map((player, j) => (
                  <td>
                    <input
                      className="bg-gray-800 w-16 text-center"
                      onChange={(e) => handleHoleChange(e, i)}
                      value={player.scores[i]}
                      disabled={j !== 0}
                      type="number"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td>Total</td>
              {state && state.players.map(player => (
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

