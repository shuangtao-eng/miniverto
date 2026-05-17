import { useState, useEffect } from 'react'

export function StreamingCursor() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setInterval(() => setVisible((v) => !v), 530)
    return () => clearInterval(t)
  }, [])

  return (
    <span
      className="inline-block w-0.5 bg-primary align-text-bottom transition-opacity duration-100"
      style={{ height: '1em', marginLeft: 2, opacity: visible ? 1 : 0 }}
    />
  )
}
