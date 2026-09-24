import { useEffect, useMemo, useState } from 'react'

const BUSINESS_TIME_ZONE = 'Asia/Dhaka'

export function LiveDateTime() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const formatters = useMemo(() => ({
    time: new Intl.DateTimeFormat('en-BD', {
      timeZone: BUSINESS_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }),
    date: new Intl.DateTimeFormat('en-BD', {
      timeZone: BUSINESS_TIME_ZONE,
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  }), [])

  return (
    <aside className="live-clock" aria-label="Current date and time" aria-live="off">
      <span className="live-clock-dot" aria-hidden="true" />
      <div>
        <time className="live-clock-time" dateTime={now.toISOString()}>{formatters.time.format(now)}</time>
        <time className="live-clock-date" dateTime={now.toISOString()}>{formatters.date.format(now)}</time>
      </div>
      <small>Dhaka time</small>
    </aside>
  )
}
