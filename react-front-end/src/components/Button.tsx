
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

export default Button

