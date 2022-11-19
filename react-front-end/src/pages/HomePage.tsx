import { Link } from 'react-router-dom'

import Button from '../components/Button'

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

export default HomePage

