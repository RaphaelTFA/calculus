import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-4xl font-extrabold text-slate-800 mb-2">404</h1>
        <p className="text-slate-500 text-lg mb-8">Trang bạn tìm kiếm không tồn tại</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <Home className="w-5 h-5" />
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}
