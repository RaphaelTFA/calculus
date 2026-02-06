import { useNavigate } from 'react-router-dom'
import { User, Settings, LogOut, Trophy, Flame, Star, X, ChevronRight, Bell, Moon, Lock, Sparkles } from 'lucide-react'
import { useAuthStore } from '../lib/store'
import { useState, useEffect } from 'react'

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated, updateProfile } = useAuthStore()

  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!isAuthenticated()) {
    navigate('/login')
    return null
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await updateProfile({ display_name: displayName })
      setShowEditProfile(false)
    } catch (err) {
      console.error(err)
      alert("Không thể cập nhật hồ sơ")
    } finally {
      setSaving(false)
    }
  }

  const xp = user?.xp || 0
  const level = Math.floor(xp / 100) + 1
  const xpProgress = xp % 100

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-500">

      {/* ================= PROFILE HEADER ================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-[2px]">
        <div className="relative bg-white rounded-[22px] p-6 text-center">
          {/* Decorative blurs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-200/40 to-transparent rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200/40 to-transparent rounded-full blur-xl" />
          
          {/* Avatar */}
          <div className="relative inline-block mb-4">
            <div className="w-28 h-28 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full p-1 shadow-xl shadow-purple-500/25">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <span className="text-4xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  {user?.display_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Lv.{level}
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-800 mb-1">
            {user?.display_name || user?.username}
          </h1>
          <p className="text-slate-500 mb-4">@{user?.username}</p>

          {/* XP Progress */}
          <div className="max-w-xs mx-auto">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
              <span>Level {level}</span>
              <span>{xpProgress}/100 XP</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<Flame />} value={user?.current_streak || 0} label="Streak" color="orange" />
        <StatCard icon={<Star />} value={xp} label="XP" color="yellow" />
        <StatCard icon={<Trophy />} value={12} label="Badges" color="purple" />
      </div>

      {/* ================= MENU ================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <MenuItem
          icon={<User className="w-5 h-5" />}
          label="Chỉnh sửa hồ sơ"
          desc="Cập nhật thông tin"
          onClick={() => { setDisplayName(user?.display_name || ""); setShowEditProfile(true) }}
        />
        <MenuItem
          icon={<Settings className="w-5 h-5" />}
          label="Cài đặt"
          desc="Tùy chỉnh ứng dụng"
          onClick={() => setShowSettings(true)}
        />
        <MenuItem
          icon={<LogOut className="w-5 h-5" />}
          label="Đăng xuất"
          desc="Thoát tài khoản"
          onClick={handleLogout}
          danger
          last
        />
      </div>

      {/* ================= EDIT PROFILE MODAL ================= */}
      {showEditProfile && (
        <Modal title="Chỉnh sửa hồ sơ" onClose={() => setShowEditProfile(false)}>
          <div className="space-y-5">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full p-0.5">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent">
                    {displayName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
            </div>
            <InputField label="Tên hiển thị" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Nhập tên của bạn" />
            <InputField label="Username" value={user?.username} disabled prefix="@" />
            <InputField label="Email" value={user?.email} disabled />
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowEditProfile(false)} className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Hủy
              </button>
              <button onClick={handleSaveProfile} disabled={saving} className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all disabled:opacity-70">
                {saving ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Đang lưu...</span> : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= SETTINGS MODAL ================= */}
      {showSettings && (
        <Modal title="Cài đặt" onClose={() => setShowSettings(false)}>
          <div className="space-y-2">
            <SettingRow icon={<Moon className="w-5 h-5 text-indigo-500" />} label="Chế độ tối" desc="Giao diện tối cho mắt">
              <Toggle checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
            </SettingRow>
            <SettingRow icon={<Bell className="w-5 h-5 text-orange-500" />} label="Thông báo" desc="Nhắc nhở học tập">
              <Toggle checked={notifications} onChange={() => setNotifications(!notifications)} />
            </SettingRow>
            <div className="pt-3">
              <button className="w-full py-3 px-4 rounded-xl border-2 border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                Đổi mật khẩu
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ================= COMPONENTS ================= */

function StatCard({ icon, value, label, color }) {
  const colors = {
    orange: 'from-orange-500 to-red-500 bg-orange-50 text-orange-500',
    yellow: 'from-yellow-400 to-amber-500 bg-yellow-50 text-yellow-500',
    purple: 'from-purple-500 to-pink-500 bg-purple-50 text-purple-500',
  }
  const [gradient, bg, text] = colors[color].split(' ')
  
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
      <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-2 ${text} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="text-2xl font-extrabold text-slate-800">{value}</div>
      <div className="text-xs text-slate-400 font-medium">{label}</div>
    </div>
  )
}

function MenuItem({ icon, label, desc, onClick, danger, last }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 transition-all group
        ${danger ? 'hover:bg-red-50 text-red-500' : 'hover:bg-slate-50 text-slate-700'}
        ${!last && 'border-b border-slate-100'}
      `}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors
        ${danger ? 'bg-red-100 group-hover:bg-red-200' : 'bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-500'}
      `}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <div className="font-semibold">{label}</div>
        <div className={`text-xs ${danger ? 'text-red-400' : 'text-slate-400'}`}>{desc}</div>
      </div>
      {!danger && <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />}
    </button>
  )
}

function InputField({ label, prefix, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{prefix}</span>}
        <input
          {...props}
          className={`w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-700 
            focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            ${prefix ? 'pl-8' : ''}
          `}
        />
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button onClick={onChange} className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${checked ? 'bg-blue-500' : 'bg-slate-200'}`}>
      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${checked ? 'left-6' : 'left-1'}`} />
    </button>
  )
}

function SettingRow({ icon, label, desc, children }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">{icon}</div>
      <div className="flex-1">
        <div className="font-semibold text-slate-700">{label}</div>
        <div className="text-xs text-slate-400">{desc}</div>
      </div>
      {children}
    </div>
  )
}

function Modal({ title, children, onClose }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setVisible(true) }, [])
  
  const handleClose = () => { setVisible(false); setTimeout(onClose, 200) }

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose}>
      <div className={`bg-white w-full max-w-md rounded-3xl p-6 relative shadow-2xl transition-all duration-300 ${visible ? 'translate-y-0 scale-100' : 'translate-y-8 sm:scale-95'}`} onClick={e => e.stopPropagation()}>
        <button onClick={handleClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
          <X className="w-4 h-4 text-slate-500" />
        </button>
        <h2 className="text-xl font-bold text-slate-800 mb-6">{title}</h2>
        {children}
      </div>
    </div>
  )
}
