import { useState } from 'react'
import { createBrowserRouter, RouterProvider, redirect } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import HomePage from './pages/HomePage'
import JoinRoomPage from './pages/JoinPage'
import Room from './pages/Room';

const queryClient = new QueryClient()

function App() {
  const [username] = useState(() => {
    const localUName = localStorage.getItem("username")
    return localUName ?? ""
  })

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
            // Joins room on back end
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

