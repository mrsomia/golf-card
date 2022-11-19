import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import HomePage from './pages/HomePage'
import JoinRoomPage from './pages/JoinPage'
import Room from './pages/Room';

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


    return <RouterProvider router={router} />
}

export default App

