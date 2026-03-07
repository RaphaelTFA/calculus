import { useState } from 'react'
import { Mail, X, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useAuthStore, useUIStore } from '../lib/store'
import api from '../lib/api'

export default function EmailVerificationBanner() {
  const { user, fetchUser } = useAuthStore()
  const { showToast } = useUIStore()
  const [isHidden, setIsHidden] = useState(false)
  const [isResending, setIsResending] = useState(false)

  // Don't show if user is verified or banner is hidden
  if (!user || user.is_active || isHidden) {
    return null
  }

  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      await api.post('/auth/resend-verification', { email: user.email })
      showToast('Email xác minh đã được gửi! Vui lòng kiểm tra hộp thư.', 'success')
    } catch (error) {
      showToast(error.message || 'Không thể gửi email xác minh', 'error')
    } finally {
      setIsResending(false)
    }
  }

  const handleCheckVerification = async () => {
    // Refresh user data to check if verified
    await fetchUser()
    if (user?.is_active) {
      showToast('Email đã được xác minh thành công!', 'success')
    }
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Xác minh email của bạn
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Chúng tôi đã gửi email xác minh đến <span className="font-semibold">{user.email}</span>. 
                Vui lòng kiểm tra hộp thư và nhấp vào link để xác minh.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleCheckVerification}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              title="Kiểm tra xem đã verify chưa"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã xác minh</span>
            </button>

            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isResending ? 'Đang gửi...' : 'Gửi lại'}
              </span>
              <span className="sm:hidden">Gửi lại</span>
            </button>

            <button
              onClick={() => setIsHidden(true)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Ẩn thông báo này"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
