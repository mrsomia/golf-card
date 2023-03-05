import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import Button from '../components/Button'
import { roomDataSchema } from '../utils/room-utils'

function HomePage() {
  const navigate = useNavigate()
  const [userState] = useState(() => {
    const localStateString = localStorage.getItem("connectedGolfRoom")
    if (!localStateString) return

    try {
      const localState = roomDataSchema.parse(JSON.parse(localStateString))
      return localState
    } catch (e) {
      console.error(e)
    }
  })

  useEffect(() => {
    if (userState) {
      try {
        // Navigates to room if in a room in last 18 horus
        const oldestDate = new Date(Date.now() - (1000 * 60 * 60 * 18)) // 18 hours
        z.coerce.date().min(oldestDate).parse(userState.user.lastAccessed)
        navigate(`/room/${userState.room.name}`)
      } catch (e) {
        // Clears old room data
        localStorage.removeItem("connectedGolfRoom")
        navigate(`/join-room/`)
      }
    }
  }, [userState])

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

export default HomePage

