import { useEffect, useRef, useState, useCallback } from 'react'

interface UseTimerOptions {
  initialSeconds: number
  onComplete?: () => void
}

export function useTimer({ initialSeconds, onComplete }: UseTimerOptions) {
  const [seconds, setSeconds]         = useState(initialSeconds)
  const [running, setRunning]         = useState(false)
  const [total, setTotal]             = useState(initialSeconds)
  const [extensions, setExtensions]   = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const secondsRef  = useRef(initialSeconds)

  const start = useCallback(() => {
    setRunning(true)
    setSeconds(initialSeconds)
    secondsRef.current = initialSeconds
  }, [initialSeconds])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      secondsRef.current -= 1
      setSeconds(secondsRef.current)
      if (secondsRef.current <= 0) {
        clearInterval(intervalRef.current!)
        setRunning(false)
        onComplete?.()
      }
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [running, onComplete])

  const extend = useCallback(() => {
    if (extensions >= 3) return
    const added = 30
    secondsRef.current += added
    setSeconds(s => s + added)
    setTotal(t => t + added)
    setExtensions(e => e + 1)
  }, [extensions])

  const stop = useCallback(() => {
    clearInterval(intervalRef.current!)
    setRunning(false)
  }, [])

  const elapsed = total - seconds

  return { seconds, running, total, elapsed, extensions, start, stop, extend, maxExtensions: 3 }
}
