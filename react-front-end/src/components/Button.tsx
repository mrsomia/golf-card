
interface ButtonProps { 
    text: string;
    addClasses?: string;
    onClick?: () => void
}

function Button({ text, addClasses, onClick } : ButtonProps) {
  return(
      <button 
        className={`p-2 px-4 rounded-xl w-40 bg-orange-600 hover:bg-orange-800
            text-stone-100 ${addClasses}`}
        onClick={onClick}
      >
        {text}
      </button>
  )
}

export default Button

