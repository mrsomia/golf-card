import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'

import HomePage from './pages/HomePage'
import JoinRoomPage from './pages/JoinPage'
import Room from './pages/Room';

const queryClient = new QueryClient()

function App() {

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
            element: <Room />
        }
    ]); 

   return <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
    </QueryClientProvider>
}

export default App

