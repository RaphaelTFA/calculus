import { useState, useEffect } from 'react'
import { Flame } from 'lucide-react'
import api from '../lib/api'
import { Card, CardContent } from './ui/card'

// Helper: compute current week's Monday as YYYY-MM-DD
const getThisWeekMonday = () => {
  const d = new Date()
  const day = d.getDay()
  console.debug('Today is day index', day)
  const diff = (day === 0 ? 6 : day - 1)
  const monday = new Date(d)
  monday.setDate(d.getDate() - diff)
  monday.setHours(0,0,0,0)
  return monday.toISOString().slice(0,10)
}

export default function LearningStreakCard({
  // component now relies on backend for all data; props are ignored
  theme = { from: 'bg-blue-900', to: 'bg-teal-800', accent: 'from-blue-400 to-teal-300' }
}) {
  const [streak, setStreak] = useState(0)
  const [days, setDays] = useState([false,false,false,false,false,false,false])

  // server will provide today index and streak info; initialize from client time as fallback
  const [todayIndex, setTodayIndex] = useState(() => (new Date().getDay() + 6) % 7)
  const [todayCompleted, setTodayCompleted] = useState(false)
  const [longest, setLongest] = useState(0)
  const [weekStart, setWeekStart] = useState(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await api.get(`/progress/streak-week`)
        if (!mounted) return
        if (res) {
          // API returns authoritative fields: week_start, days, current_streak, longest_streak, today_index, today_completed
          const d = Array.isArray(res.days) && res.days.length === 7 ? res.days.map(x => !!x) : [false,false,false,false,false,false,false]
          setDays(d)
          if (typeof res.current_streak === 'number') setStreak(res.current_streak)
          if (typeof res.longest_streak === 'number') setLongest(res.longest_streak)
          if (typeof res.today_index === 'number') setTodayIndex(res.today_index)
          setTodayCompleted(Boolean(res.today_completed))
          if (res.week_start) setWeekStart(res.week_start)
        }
      } catch (e) {
        console.debug('Failed to load streak week', e)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // component driven by backend; no local editing flow

  const toggleDay = (i) => {
    const copy = [...days]
    copy[i] = !copy[i]
    // send full days array to backend and replace local state with authoritative response
    api.post('/progress/streak-week', { days: copy }).then(res => {
      if (!res) return
      const d = Array.isArray(res.days) && res.days.length === 7 ? res.days.map(x => !!x) : copy
      setDays(d)
      if (typeof res.current_streak === 'number') setStreak(res.current_streak)
      if (typeof res.longest_streak === 'number') setLongest(res.longest_streak)
      if (typeof res.today_index === 'number') setTodayIndex(res.today_index)
      setTodayCompleted(Boolean(res.today_completed))
      if (res.week_start) setWeekStart(res.week_start)
    }).catch(err => console.debug('failed save streak week', err))
  }

  return (
    <Card className="border-2 border-orange-200/50 bg-gradient-to-br from-white to-orange-50/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${streak >= 7 ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-orange-100'}`}>
            <Flame className={`w-7 h-7 ${streak >= 7 ? 'text-white' : 'text-orange-500'}`} />
          </div>
          <div className="flex-1">
            <p className="text-3xl font-bold text-foreground leading-none mb-1">{streak}</p>
            <p className="text-sm text-muted-foreground font-semibold">Day Streak • <span className="font-medium">{longest} longest</span></p>
            {weekStart && <div className="mt-1 text-xs text-slate-400">Week of {weekStart}</div>}
          </div>
        </div>

        <div className="mt-4">
          <div className="grid grid-cols-7 gap-2 text-center">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => {
              const isToday = i === todayIndex
              const done = Array.isArray(days) && !!days[i]
              const todayHighlight = isToday && done
              return (
                <div key={d} className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${todayHighlight ? 'bg-amber-500 text-white shadow-md' : done ? 'bg-amber-400 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>
                    <span className="uppercase">{d[0]}</span>
                  </div>
                  <div className={`mt-1 text-[10px] ${todayHighlight ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>{d}</div>
                </div>
              )
            })}
          </div>
        </div>

        {todayCompleted && (
          <p className="text-sm text-orange-600 mt-3 font-bold"> You completed today's learning!</p>
        )}

        {!todayCompleted && (
          <p className="text-sm text-orange-600 mt-3 font-bold"> Don't break the streak! Complete today's learning.</p>
        )}
      </CardContent>
    </Card>
  )
}
