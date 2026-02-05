import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Compass, User, Flame, Zap, Settings, LogOut, HelpCircle, Bell } from 'lucide-react'
import { useAuthStore, useUIStore } from '../lib/store'
import Toast from './Toast'
import AnimatedOutlet from './AnimatedOutlet'

// shadcn/ui components
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { toast } = useUIStore()

  // Hick's Law: Max 2 top-level nav items
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/explore', icon: Compass, label: 'Explore' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Minimal, clean */}
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-xl text-primary-foreground font-bold">∫</span>
            </div>
            <span className="font-bold text-xl text-foreground hidden sm:block">Calculus</span>
          </Link>

          {/* Desktop Navigation - 2 items only (Hick's Law) */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label }) => {
              const isActive = location.pathname === path
              return (
                <Button
                  key={path}
                  variant={isActive ? 'secondary' : 'ghost'}
                  asChild
                  className="font-semibold"
                >
                  <Link to={path}>{label}</Link>
                </Button>
              )
            })}
          </nav>

          {/* Right side - Status badges + User dropdown */}
          <div className="flex items-center gap-3">
            {user && (
              <>
                {/* Streak badge - passive display */}
                <Badge variant="streak" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5">
                  <Flame className="w-4 h-4" />
                  <span>{user.current_streak || 0}</span>
                </Badge>

                {/* XP badge - passive display */}
                <Badge variant="default" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-primary-100 text-primary-700 border-0">
                  <Zap className="w-4 h-4" />
                  <span>{user.xp || 0}</span>
                </Badge>

                {/* User Dropdown - Secondary actions hidden here (Hick's Law) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url} alt={user.display_name} />
                        <AvatarFallback className="bg-primary-100 text-primary-700 font-semibold">
                          {getInitials(user.display_name || user.username)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none">{user.display_name || user.username}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Bell className="mr-2 h-4 w-4" />
                      <span>Notifications</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>Help</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {!user && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Get started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24 md:pb-8">
        <AnimatedOutlet />
      </main>

      {/* Mobile Bottom Navigation - 2 primary items only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-40 md:hidden">
        <div className="flex justify-around py-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors ${
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className="text-xs font-semibold">{label}</span>
              </Link>
            )
          })}
          {/* Profile as third item on mobile */}
          <Link
            to="/profile"
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors ${
              location.pathname === '/profile'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className={`w-6 h-6 ${location.pathname === '/profile' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-xs font-semibold">Profile</span>
          </Link>
        </div>
      </nav>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
