import { useEffect, useState } from 'react'
import { z } from 'zod'
import { createBrowserRouter, RouterProvider, redirect } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { roomDataSchema } from './utils/room-utils'
import HomePage from './pages/HomePage'
import JoinRoomPage from './pages/JoinPage'
import Room from './pages/Room';

const queryClient = new QueryClient()

function App() {
  const [username] = useState(() => {
    const localUName = localStorage.getItem("username")
    return localUName ?? ""
  })

  const [userState, setUserState] = useState<z.infer<typeof roomDataSchema>>()

  useEffect(() => {
    const localStateString = localStorage.getItem("connectedGolfRoom")
    if (!localStateString) return

    try {
      const localState = roomDataSchema.parse(JSON.parse(localStateString))
      setUserState(localState)
    } catch (e) {
      console.error(e)
    }

  }, [])

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
        {
            path: "room/:roomId",
            element: <Room />,
            loader: async({ params }) => {
              const { roomId } = params
              if (!roomId) {
                redirect("/join-room")
              }
              if (!username) {
                redirect(`/join-room/${roomId}`)
              }
              return fetch(`${import.meta.env.VITE_SERVER_URL}/join-room/`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body : JSON.stringify({ username, roomName: roomId  }),
                })
            },
        }
    ]); 

   return <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
}

export default App

