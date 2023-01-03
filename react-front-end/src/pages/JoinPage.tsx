import { useEffect, useState } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'


function JoinRoomPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const createMode = location.pathname.startsWith("/create-room")
    const { roomId } = useParams()
    const [ roomID, setRoomID ] = useState(roomId ?? "")
    const [ userName, setUserName ] = useState("")

  useEffect(() => {
    const localUName = localStorage.getItem("username")
    if (localUName) setUserName(localUName)
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Save the username locally
    e.preventDefault()
    if (!userName) {
      // Do Something with the UI
      console.error("No username present")
      return
    }
    localStorage.setItem('username', userName)
    if (createMode) {
      // creates a Room  
      try {
        const r = await fetch(`${import.meta.env.VITE_SERVER_URL}/create-room`, {
          method: 'POST',
          body: JSON.stringify({
            user: {
              name: userName
            }
          })
        })
        const res = await r.json()
        navigate(`/room/${res.room}`)

        console.log(res)
        // TODO: Validate here with zod
      } catch (e) {
        // TODO: Handles errors
        console.error(e)
      }
    } else {
      navigate(`/room/${roomID}`)
    }
  }

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
            onSubmit={handleSubmit}
        >
                <label 
                    htmlFor="RoomID"
                    className={`text-lg ${createMode ? 'hidden' : ''}`}
                >
                    Room ID
                </label>
                <input 
                    type='text'
                    value={roomID} 
                    id="RoomID" 
                    onChange={e => setRoomID(e.target.value)}
                    className={`text-black p-2 px-4 w-60 ${createMode ? 'hidden' : ''}`}
                    />
            <label 
                htmlFor="userName"
                className='text-lg'
            >
                Your Name
            </label>
            <input 
                type='text'
                value={userName} 
                id="userName" 
                onChange={e => setUserName(e.target.value)}
                className='text-black p-2 px-4 w-60'
            />

            <input
              type="submit"
              value={createMode ? "Create Room" : "Join"}
              className={`p-2 px-4 rounded-xl w-40 bg-orange-600
                hover:bg-orange-800 text-stone-100 my-16`}
            />

        </form>
    </div>
}

export default JoinRoomPage

