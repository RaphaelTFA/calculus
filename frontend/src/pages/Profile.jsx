import { useNavigate } from 'react-router-dom'
import { User, Settings, LogOut, Trophy, Flame, Star, X } from 'lucide-react'
import { useAuthStore } from '../lib/store'
import { useState } from 'react'

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated, updateProfile } = useAuthStore()

  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [username, setUsername] = useState(user?.username || '')
  const [darkMode, setDarkMode] = useState(false)

  if (!isAuthenticated()) {
    navigate('/login')
    return null
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleSaveProfile = async () => {
    try {
      const updatedUser = await updateProfile({
        display_name: displayName,
        username: username,
      })

      console.log("UPDATED USER:", updatedUser)
      setShowEditProfile(false)
    } catch (err) {
      console.error(err)
      alert("Không thể cập nhật hồ sơ")
    }
  }


  return (
    <div className="space-y-8 relative">

      {/* ================= PROFILE HEADER ================= */}
      <div className="card p-8 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl text-white font-bold shadow-lg">
          {user?.display_name?.[0] || user?.username?.[0] || 'U'}
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800">
          {user?.display_name || user?.username}
        </h1>
        <p className="text-slate-500">@{user?.username}</p>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-3 gap-4">
        <Stat icon={<Flame className="w-8 h-8 text-orange-500" />} value={user?.current_streak || 0} label="Streak" />
        <Stat icon={<Star className="w-8 h-8 text-yellow-500" />} value={user?.xp || 0} label="XP" />
        <Stat icon={<Trophy className="w-8 h-8 text-purple-500" />} value={12} label="Badges" />
      </div>

      {/* ================= MENU ================= */}
      <div className="card divide-y divide-slate-100">
        <button
          onClick={() => setShowEditProfile(true)}
          className="w-full flex items-center gap-4 p-4 hover:bg-slate-50"
        >
          <User className="w-5 h-5 text-slate-400" />
          <span className="font-semibold">Chỉnh sửa hồ sơ</span>
        </button>

        <button
          onClick={() => setShowSettings(true)}
          className="w-full flex items-center gap-4 p-4 hover:bg-slate-50"
        >
          <Settings className="w-5 h-5 text-slate-400" />
          <span className="font-semibold">Cài đặt</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 p-4 hover:bg-red-50 text-red-600"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-semibold">Đăng xuất</span>
        </button>
      </div>

      {/* ================= EDIT PROFILE MODAL ================= */}
      {showEditProfile && (
        <Modal title="Chỉnh sửa hồ sơ" onClose={() => setShowEditProfile(false)}>
          <div className="space-y-4">
            <Input label="Tên hiển thị" value={displayName} onChange={e => setDisplayName(e.target.value)} />
            <Input label="Username" value={username} onChange={e => setUsername(e.target.value)} />

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowEditProfile(false)} className="btn-secondary">
                Hủy
              </button>
              <button onClick={handleSaveProfile} className="btn-primary">
                Lưu
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= SETTINGS MODAL ================= */}
      {showSettings && (
        <Modal title="Cài đặt" onClose={() => setShowSettings(false)}>
          <div className="space-y-4">

            <div className="flex items-center justify-between">
              <span>Dark Mode</span>
              <input
                type="checkbox"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
            </div>

            <div className="flex items-center justify-between">
              <span>Thông báo</span>
              <input type="checkbox" defaultChecked />
            </div>

            <button className="w-full btn-primary">
              Đổi mật khẩu
            </button>

          </div>
        </Modal>
      )}

    </div>
  )
}

/* ================= SMALL COMPONENTS ================= */

function Stat({ icon, value, label }) {
  return (
    <div className="card p-4 text-center">
      <div className="mx-auto mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs uppercase text-slate-400">{label}</div>
    </div>
  )
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <input
        {...props}
        className="w-full border rounded-lg px-3 py-2"
      />
    </div>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-xl p-6 relative">

        <button
          onClick={onClose}
          className="absolute top-3 right-3"
        >
          <X />
        </button>

        <h2 className="text-xl font-bold mb-4">{title}</h2>

        {children}

      </div>
    </div>
  )
}
