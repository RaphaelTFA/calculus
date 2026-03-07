import { useState, useEffect } from 'react'
import { Mail, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react'
import { useAuthStore, useUIStore } from '../lib/store'
import api from '../lib/api'

export default function VerificationBlocker() {
  const { user, logout, fetchUser } = useAuthStore()
  const { showToast } = useUIStore()
  const [isResending, setIsResending] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Show blocker only if user logged in but not verified
  const shouldBlock = user && !user.is_active

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  if (!shouldBlock) {
    return null
  }

  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      await api.post('/auth/resend-verification')
      showToast('Verification email sent! Please check your inbox.', 'success')
      setCountdown(60) // 60 seconds cooldown
    } catch (error) {
      showToast(error.message || 'Failed to send verification email', 'error')
    } finally {
      setIsResending(false)
    }
  }

  const handleCheckVerification = async () => {
    setIsChecking(true)
    try {
        await fetchUser() // Refresh user data
    } catch (error) {
      showToast('Failed to check verification status', 'error')
    } finally {
      setIsChecking(false)
    }
  }

  const handleLogout = () => {
    logout()
    showToast('Logged out', 'success')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Mail className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Verify Email
          </h2>
          <p className="text-amber-50 text-sm">
            Please verify your email to continue
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-700 text-center">
              We sent a verification email to
            </p>
            <p className="text-base font-bold text-slate-900 text-center mt-1">
              {user.email}
            </p>
            <p className="text-xs text-slate-600 text-center mt-3">
              Please check your inbox (including spam) and click the verification link.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleCheckVerification}
              disabled={isChecking}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className={`w-5 h-5 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Checking...' : 'I Verified'}
            </button>

            <button
              onClick={handleResendEmail}
              disabled={isResending || countdown > 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-100 hover:bg-amber-200 text-amber-700 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 ${isResending ? 'animate-spin' : ''}`} />
              {isResending ? 'Sending...' : 
               countdown > 0 ? `Resend in ${countdown}s` : 
               'Resend verification email'}
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>

          {/* Help text */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              Didn't receive the email?{' '}
              <button 
                onClick={handleResendEmail}
                disabled={countdown > 0}
                className="text-amber-600 hover:text-amber-700 font-semibold underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Resend
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
