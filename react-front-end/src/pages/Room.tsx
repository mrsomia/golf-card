import { useParams } from "react-router-dom"


function Room() {
    const { roomId } = useParams()
    return <div
        className='flex flex-col justify-center items-center w-screen min-h-screen
        bg-gray-800 text-stone-300 gap-8'
    > 
        <h1 className='text-5xl font-bold pa8 my-8'>Room {`${roomId}`}</h1>
    </div>
}

export default Room
