import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, Compass, User, Flame } from 'lucide-react'
import { useAuthStore, useUIStore } from '../lib/store'
import Toast from './Toast'

export default function Layout() {
  const location = useLocation()
  const { user } = useAuthStore()
  const { toast } = useUIStore()

  const navItems = [
    { path: '/', icon: Home, label: 'Trang chủ' },
    { path: '/explore', icon: Compass, label: 'Khám phá' },
    { path: '/profile', icon: User, label: 'Hồ sơ' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">∫</span>
            <span className="font-extrabold text-xl text-primary-600">Calculus</span>
          </Link>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <div className="flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-full">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="font-bold text-orange-600">{user.current_streak || 0}</span>
                </div>
                <div className="flex items-center gap-1 bg-primary-50 px-3 py-1.5 rounded-full">
                  <span className="text-primary-500">⚡</span>
                  <span className="font-bold text-primary-600">{user.xp || 0}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-40">
        <div className="flex justify-around py-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                  isActive ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-semibold">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
