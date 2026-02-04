import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore, useUIStore } from '../lib/store'
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react'

export default function Register() {
  const navigate = useNavigate()
  const { register, isLoading, error, clearError } = useAuthStore()
  const { showToast } = useUIStore()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Password validation
  const passwordChecks = {
    length: password.length >= 6,
    match: password === confirmPassword && confirmPassword.length > 0,
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    
    if (!username.trim() || !email.trim() || !password.trim()) {
      showToast('Vui lòng nhập đầy đủ thông tin', 'error')
      return
    }
    
    if (password !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp', 'error')
      return
    }
    
    if (password.length < 6) {
      showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error')
      return
    }
    
    try {
      await register(username, email, password, displayName || username)
      showToast('Đăng ký thành công! Chào mừng bạn!', 'success')
      navigate('/')
    } catch (err) {
      showToast(err.message || 'Đăng ký thất bại', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <span className="text-4xl group-hover:scale-110 transition-transform">∫</span>
            <span className="font-extrabold text-2xl text-primary-600">Calculus</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-800">Tạo tài khoản</h1>
          <p className="text-slate-500 mt-2">Bắt đầu hành trình học Toán</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Tên đăng nhập *</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all"
              placeholder="username"
              required
              autoComplete="username"
            />
            <p className="text-xs text-slate-400 mt-1">Chỉ chữ thường, số và dấu gạch dưới</p>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Tên hiển thị</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all"
              placeholder="Nguyễn Văn A"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all"
              placeholder="email@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Mật khẩu *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Xác nhận mật khẩu *</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all"
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>
          
          {/* Password requirements */}
          {password.length > 0 && (
            <div className="space-y-2 text-sm">
              <div className={`flex items-center gap-2 ${passwordChecks.length ? 'text-green-600' : 'text-slate-400'}`}>
                {passwordChecks.length ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                Ít nhất 6 ký tự
              </div>
              {confirmPassword.length > 0 && (
                <div className={`flex items-center gap-2 ${passwordChecks.match ? 'text-green-600' : 'text-red-500'}`}>
                  {passwordChecks.match ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  Mật khẩu khớp
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !passwordChecks.length || (confirmPassword.length > 0 && !passwordChecks.match)}
            className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang tạo tài khoản...
              </>
            ) : (
              'Đăng ký'
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-slate-500">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-primary-600 font-bold hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}
