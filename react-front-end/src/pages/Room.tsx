import { useEffect, useState } from "react"
import { io, type Socket } from 'socket.io-client'
import { useNavigate, useParams } from "react-router-dom"
import Button from "../components/Button"


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

    return <>
        <div
          className='flex flex-col justify-center items-center w-screen min-h-screen
          bg-gray-800 text-stone-300 gap-8'
        >
          <h1 className='text-xl md:text-4xl font-extrabold md:font-bold pa8 my-8 text-center'>Room: {`${roomName}`}</h1>
          <span className="text-lg font-medium m-4">Connected: { '' + isConnected }</span>
          <span className="text-lg font-medium m-4">Last pong: { lastPong || "-" }</span>
          <Button onClick={ sendPing } text="Send Ping" />
        </div>
      </>
}

export default Room

