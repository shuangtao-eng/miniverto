import { useState, useEffect } from 'react'

export function useStreaming(fullText: string, active: boolean, speed = 18) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!active) {
      setDisplayed('')
      setDone(false)
      return
    }
    setDisplayed('')
    setDone(false)
    let i = 0
    const timer = setInterval(() => {
      i += Math.ceil(Math.random() * 3 + 1)
      if (i >= fullText.length) {
        setDisplayed(fullText)
        setDone(true)
        clearInterval(timer)
      } else {
        setDisplayed(fullText.slice(0, i))
      }
    }, speed)
    return () => clearInterval(timer)
  }, [fullText, active, speed])

  return { displayed, done }
}
