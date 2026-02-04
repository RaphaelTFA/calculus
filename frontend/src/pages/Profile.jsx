import { useNavigate } from 'react-router-dom'
import { User, Settings, LogOut, Trophy, Flame, Star } from 'lucide-react'
import { useAuthStore } from '../lib/store'

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuthStore()

  if (!isAuthenticated()) {
    navigate('/login')
    return null
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="card p-8 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl text-white font-bold shadow-lg">
          {user?.display_name?.[0] || user?.username?.[0] || 'U'}
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800">{user?.display_name || user?.username}</h1>
        <p className="text-slate-500">@{user?.username}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-800">{user?.current_streak || 0}</div>
          <div className="text-xs font-bold text-slate-400 uppercase">Streak</div>
        </div>
        <div className="card p-4 text-center">
          <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-800">{user?.xp || 0}</div>
          <div className="text-xs font-bold text-slate-400 uppercase">XP</div>
        </div>
        <div className="card p-4 text-center">
          <Trophy className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-800">12</div>
          <div className="text-xs font-bold text-slate-400 uppercase">Badges</div>
        </div>
      </div>

      {/* Menu */}
      <div className="card divide-y divide-slate-100">
        <button className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left">
          <User className="w-5 h-5 text-slate-400" />
          <span className="font-semibold text-slate-700">Chỉnh sửa hồ sơ</span>
        </button>
        <button className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left">
          <Settings className="w-5 h-5 text-slate-400" />
          <span className="font-semibold text-slate-700">Cài đặt</span>
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 p-4 hover:bg-red-50 transition-colors text-left text-red-600"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-semibold">Đăng xuất</span>
        </button>
      </div>
    </div>
  )
}
