import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Play, Trophy, Flame, Gem, Star } from 'lucide-react'
import { useAuthStore } from '../lib/store'
import api from '../lib/api'

export default function Home() {
  const { user, isAuthenticated } = useAuthStore()
  const [currentStory, setCurrentStory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const data = await api.get('/progress/dashboard')
      setCurrentStory(data?.current_story)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated()) {
    return <Landing />
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800">
          Chào mừng, {user?.display_name || user?.username}! 👋
        </h1>
        <p className="text-slate-500 font-medium text-lg">
          Tiếp tục hành trình chinh phục Toán học nào!
        </p>
      </div>

      {/* Continue Learning Card */}
      {loading ? (
        <div className="skeleton h-56 rounded-3xl" />
      ) : currentStory ? (
        <Link 
          to={`/story/${currentStory.slug}`}
          className="block bg-gradient-to-r from-primary-600 to-primary-500 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg hover:scale-[1.02] transition-transform"
        >
          <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
            <div className="text-[200px] -mt-10">{currentStory.icon}</div>
          </div>
          
          <p className="text-primary-100 font-bold uppercase tracking-wider text-sm mb-2">Tiếp tục học</p>
          <h2 className="text-3xl font-extrabold mb-4">{currentStory.title}</h2>
          
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 bg-white text-primary-600 px-6 py-3 rounded-xl font-extrabold uppercase tracking-wider shadow-lg hover:bg-slate-50 transition-colors">
              <Play className="w-5 h-5" fill="currentColor" />
              Tiếp tục
            </button>
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2 text-primary-100">
                <span>Tiến độ</span>
                <span>{currentStory.progress || 0}%</span>
              </div>
              <div className="bg-black/20 rounded-full h-3">
                <div 
                  className="bg-white rounded-full h-3 transition-all duration-500" 
                  style={{ width: `${currentStory.progress || 0}%` }}
                />
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <Link to="/explore" className="block card-hover p-8 text-center">
          <p className="text-slate-500 font-medium mb-4">Bạn chưa bắt đầu khóa học nào.</p>
          <span className="btn-primary inline-block">Khám phá ngay</span>
        </Link>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Flame className="w-8 h-8 text-orange-500" />} value={user?.current_streak || 0} label="Streak" />
        <StatCard icon={<Star className="w-8 h-8 text-yellow-500" />} value={Math.floor((user?.xp || 0) / 100)} label="Level" />
        <StatCard icon={<Gem className="w-8 h-8 text-blue-500" />} value={350} label="Gems" />
        <StatCard icon={<Trophy className="w-8 h-8 text-purple-500" />} value={12} label="Badges" />
      </div>
    </div>
  )
}

function StatCard({ icon, value, label }) {
  return (
    <div className="card p-6 flex flex-col items-center justify-center gap-2">
      {icon}
      <span className="text-2xl font-bold text-slate-700">{value}</span>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
  )
}

function Landing() {
  return (
    <div className="text-center py-16 space-y-8">
      <h1 className="text-5xl font-extrabold text-slate-800">
        Học Toán <span className="text-primary-500">Thú Vị</span>
      </h1>
      <p className="text-xl text-slate-500 max-w-2xl mx-auto">
        Khám phá thế giới toán học qua các bài học tương tác, từ giải tích đến đại số tuyến tính.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/register" className="btn-primary text-lg px-8 py-4">
          Bắt đầu miễn phí
        </Link>
        <Link to="/explore" className="btn-secondary text-lg px-8 py-4">
          Khám phá khóa học
        </Link>
      </div>
    </div>
  )
}
