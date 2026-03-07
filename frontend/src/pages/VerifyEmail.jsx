import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../lib/store'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { fetchUser } = useAuthStore()
  const [status, setStatus] = useState('verifying') // verifying | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')
      
      if (!token) {
        setStatus('error')
        setMessage('Token xác minh không hợp lệ')
        return
      }

      try {
        const response = await api.get(`/auth/verify-email?token=${token}`)
        setStatus('success')
        setMessage(response.message || 'Email đã được xác minh thành công!')
        
        // Update user data
        await fetchUser()
        
        // Auto redirect after 3 seconds
        setTimeout(() => {
          navigate('/')
        }, 3000)
      } catch (error) {
        setStatus('error')
        setMessage(error.message || 'Không thể xác minh email. Token có thể đã hết hạn.')
      }
    }

    verifyEmail()
  }, [searchParams, navigate, fetchUser])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                Đang xác minh email...
              </h1>
              <p className="text-slate-600">
                Vui lòng chờ trong giây lát
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                Xác minh thành công!
              </h1>
              <p className="text-slate-600 mb-6">
                {message}
              </p>
              <p className="text-sm text-slate-500 mb-4">
                Bạn sẽ được chuyển hướng về trang chủ sau 3 giây...
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                Về trang chủ ngay
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                Xác minh thất bại
              </h1>
              <p className="text-slate-600 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <Link
                  to="/"
                  className="block w-full px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                >
                  Về trang chủ
                </Link>
                <Link
                  to="/login"
                  className="block w-full px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Đăng nhập
                </Link>
              </div>
            </>
          )}

          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <Mail className="w-4 h-4" />
              <span className="text-sm">Calculus - Học toán tương tác</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
