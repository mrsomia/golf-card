import { useState } from 'react'
import { createBrowserRouter, Link, useParams, useLocation, RouterProvider } from 'react-router-dom'

function App() {
    // useEffect(() => {
    //   const socket = io("wss://localhost:8080")
    //   socket.on('connection', () => {
    //     console.log(socket.id)
    //   })
    // }, [])
    // const router = createBrowserRouter([
    //   {
    //     path: "/",
    //     element: <div>Hello world!</div>,
    //   },
    // ])
    const router = createBrowserRouter([
        {
            path: "/",
            element: <HomePage />,
        },
        {
            path: "create-room",
            element: <JoinRoomPage />,
        },
        {
            path: "create-room/:roomId",
            element: <JoinRoomPage />,
        },
        {
            path: "join-room",
            element: <JoinRoomPage />,
        },
        {
            path: "join-room/:roomId",
            element: <JoinRoomPage />,
        },
    ]); 


    return <RouterProvider router={router} />
}

export default App

interface ButtonProps { 
    text: string;
    addClasses?: string
}

function Button({text, addClasses } : ButtonProps) {
  return(
      <button 
        className={`p-2 px-4 rounded-xl w-40 bg-orange-600 hover:bg-orange-800
            text-stone-100 ${addClasses}`}
      >
        {text}
      </button>
  )
}

function HomePage() {
    return <div
        className='flex flex-col justify-center items-center w-screen min-h-screen
        bg-gray-800 text-stone-300 gap-8'
    > 
        <h1 className='text-5xl font-bold pa8 my-8'>Golf Card</h1>
        <Link to="/create-room">
            <Button text={"Create Room"} />
        </Link>
        <Link to="/join-room">
            <Button text={"Join Room"} />
        </Link>
    </div>
}

function JoinRoomPage() {
    const location = useLocation()
    const createMode = location.pathname.startsWith("/create-room")
    const { roomId } = useParams()
    const [ roomID, setRoomID ] = useState(roomId ?? "")
    const [ userName, setUserName ] = useState("")
    return <div
            className='flex flex-col justify-center items-center w-screen
            min-h-screen bg-gray-800 text-stone-300 gap-8'
            > 
        <h1 className='text-5xl font-bold pa8 my-8'>
            { createMode ? "Create Room" : "Join Room" }
        </h1>
        <form 
            className='flex flex-col justify-center items-center text-center
            gap-3'
        >
            { !createMode && <>
                <label 
                    htmlFor="RoomID"
                    className='text-lg'
                >
                    Room ID
                </label>
                <input 
                    type='text'
                    value={roomID} 
                    id="RoomID" 
                    onChange={e => setRoomID(e.target.value)}
                    className='text-black p-2 px-4 w-60'
                    />
                </>
            }
            <label 
                htmlFor="userName"
                className='text-lg'
            >
                Name
            </label>
            <input 
                type='text'
                value={userName} 
                id="userName" 
                onChange={e => setUserName(e.target.value)}
                className='text-black p-2 px-4 w-60'
            />

            <Button addClasses={"my-16"} text='Join'/>
        </form>
    </div>
}
