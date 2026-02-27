import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Flame, 
  Zap, 
  Trophy, 
  Crown, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Target,
  Calendar,
  Award,
  TrendingUp,
  BookOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { X as XIcon } from 'lucide-react'
import { useAuthStore } from '../lib/store'
import api from '../lib/api'

// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Separator } from '../components/ui/separator'
import LearningStreakCard from '../components/LearningStreakCard'

export default function Home() {
  const { user, isAuthenticated, fetchUser } = useAuthStore()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  useEffect(() => {
    // Fetch fresh user data to ensure XP/streak is synced
    if (isAuthenticated()) {
      fetchUser()
    }
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const data = await api.get('/progress/dashboard')
      // Set dashboard data first
      setDashboardData(data)

      // Then fetch current user's rank and merge it into dashboardData
      try {
        const rankRes = await api.get('/progress/leaderboard?around=true&limit=1')
        if (rankRes && typeof rankRes.current_user_rank !== 'undefined') {
          setDashboardData(prev => ({ ...(prev || {}), rank: rankRes.current_user_rank }))
        }
      } catch (e) {
        // silent - dashboard still useful without rank
        console.debug('Failed to fetch current rank', e)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Get course cards to display - only in progress courses
  const getCourseCards = () => {
    if (!dashboardData) return []
    
    // Use in_progress_stories from API (already deduplicated and filtered)
    if (dashboardData.in_progress_stories && Array.isArray(dashboardData.in_progress_stories)) {
      return dashboardData.in_progress_stories
        .map(s => ({ ...s, status: 'in-progress' }))
        .slice(0, 5)
    }
    
    // Fallback to current_story if in_progress_stories not available
    if (dashboardData.current_story) {
      return [{ ...dashboardData.current_story, status: 'in-progress' }]
    }
    
    return []
  }

  const courses = getCourseCards()
  
  // Auto-slide every 10 seconds - cycle through all cards one by one
  useEffect(() => {
    if (courses.length <= 1 || isPaused) return

    const interval = setInterval(() => {
      setCurrentSlide(prev => {
        // Loop back to 0 after reaching the last card
        return (prev + 1) % courses.length
      })
    }, 10000) // 10 seconds

    return () => clearInterval(interval)
  }, [courses.length, isPaused])

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % courses.length)
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), 10000) // Resume after 10s
  }

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + courses.length) % courses.length)
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), 10000) // Resume after 10s
  }

  const goToSlide = (index) => {
    setCurrentSlide(index)
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), 10000) // Resume after 10s
  }

  if (!isAuthenticated()) {
    return <Landing />
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 2-Column Responsive Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 lg:gap-8">
        {/* Left Sidebar - Colorful & Minimal */}
        <aside className="order-2 lg:order-1 space-y-6">
          {/* Learning Streak Card (interactive) */}
          <LearningStreakCard />
          
          {/* User Stats Overview - Colorful Card */}
          <Card className="border-2 border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-100 via-pink-100 to-yellow-100 shadow-xl animate-pulse-slow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-fuchsia-700">
                <TrendingUp className="w-5 h-5 text-fuchsia-500" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <StatItem icon={Zap} label="XP" value={user?.xp || 0} color="text-yellow-600" bgColor="bg-yellow-100/80" />
                <StatItem icon={Trophy} label="Ranking" value={dashboardData?.rank ? `#${dashboardData.rank}` : '-'} color="text-purple-600" bgColor="bg-purple-100/80" />
              </div>
            </CardContent>
          </Card>

          {/* Daily Goal - More Colorful */}
          {dashboardData?.daily_goal && (
            <Card className="border-2 border-cyan-300/40 bg-gradient-to-r from-cyan-100 via-sky-100 to-green-100 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2 text-cyan-700">
                    <Calendar className="w-4 h-4 text-cyan-500 animate-spin-slow" />
                    Mục tiêu hôm nay
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs bg-cyan-200 text-cyan-800">
                    {dashboardData.daily_goal.completed}/{dashboardData.daily_goal.target}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress 
                  value={(dashboardData.daily_goal.completed / dashboardData.daily_goal.target) * 100} 
                  className="h-2 bg-cyan-200" 
                />
                <p className="text-xs text-cyan-700">
                  {dashboardData.daily_goal.remaining > 0 
                    ? `${dashboardData.daily_goal.remaining} bài nữa để hoàn thành mục tiêu!`
                    : 'Đã hoàn thành mục tiêu ngày! 🎉'
                  }
                </p>
              </CardContent>
            </Card>
          )}

          {/* Achievements Preview - Only show if available */}
          {dashboardData?.recent_achievements && dashboardData.recent_achievements.length > 0 && (
            <Card className="border-2 border-amber-300/40 bg-gradient-to-r from-yellow-100 via-amber-100 to-orange-100 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                  <Award className="w-4 h-4 text-amber-500 animate-pulse" />
                  Thành tựu gần đây
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboardData.recent_achievements.map((achievement, idx) => (
                  <AchievementItem 
                    key={idx}
                    icon={achievement.icon || '🏆'} 
                    title={achievement.title} 
                    description={achievement.description}
                    unlocked={achievement.unlocked}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* XP / League Progress - Colorful */}
          {dashboardData?.league && (
            <LeagueCard 
              xp={user?.xp || 0} 
              league={dashboardData.league} 
              rank={dashboardData.rank || 0}
              onViewLeaderboard={() => setShowLeaderboard(true)}
            />
          )}
        </aside>

        {/* Main Content Area - Course Carousel */}
        <main className="order-1 lg:order-2 space-y-6">
          {/* Friendly Greeting */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👋</span>
              <div>
                <p className="text-muted-foreground font-medium">Nice work today</p>
                <h1 className="text-xl font-bold text-foreground">
                  Welcome back, {user?.display_name || user?.username}
                </h1>
              </div>
            </div>
          </div>

          {/* Course Cards Carousel - Multiple Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="h-80 animate-pulse bg-muted" />
              <Card className="h-80 animate-pulse bg-muted hidden md:block" />
            </div>
          ) : courses.length > 0 ? (
            <div 
              className="relative"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Section Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Your Courses
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {courses.length} In Progress
                </Badge>
              </div>

              {/* Carousel Container */}
              <div className="relative overflow-hidden">
                <motion.div 
                  className="flex"
                  animate={{ 
                    x: `-${currentSlide * 100}%`
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 30 
                  }}
                >
                  {courses.map((course, idx) => (
                    <motion.div
                      key={course.slug || idx}
                      className="flex-shrink-0 w-full px-1"
                    >
                      <CourseCard story={course} />
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Navigation Controls */}
              {courses.length > 1 && (
                <>
                  {/* Previous/Next Buttons */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white hover:bg-white shadow-lg rounded-full h-10 w-10 z-20 transition-all hover:scale-110"
                    onClick={prevSlide}
                    aria-label="Previous course"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white hover:bg-white shadow-lg rounded-full h-10 w-10 z-20 transition-all hover:scale-110"
                    onClick={nextSlide}
                    aria-label="Next course"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>

                  {/* Slide Indicators */}
                  <div className="flex items-center justify-center gap-2 mt-6">
                    {courses.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => goToSlide(idx)}
                        className={`h-2 rounded-full transition-all ${
                          idx === currentSlide
                            ? 'w-8 bg-primary'
                            : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                        }`}
                        aria-label={`Go to course ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <EmptyStateCard />
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickActionCard 
              icon={Trophy} 
              title="View Leaderboard" 
              description="See how you rank"
              onClick={() => setShowLeaderboard(true)}
            />
            <QuickActionCard 
              icon={Target} 
              title="Practice" 
              description="Sharpen your skills"
              to="/explore"
            />
          </div>
        </main>
      </div>

      <AnimatePresence>
        {showLeaderboard && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <LeaderboardModal onClose={() => setShowLeaderboard(false)} user={user} />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

    // Leaderboard Modal (mobile-first, modern minimal gamified look)
    function LeaderboardModal({ onClose, user }) {
      const [items, setItems] = useState([])
      const [loading, setLoading] = useState(true)
      const [error, setError] = useState(null)
      const [currentRank, setCurrentRank] = useState(null)
      const [totalCount, setTotalCount] = useState(null)

      useEffect(() => {
        let mounted = true
        const fetchLeaderboard = async () => {
          setLoading(true)
          try {
            // Fetch top 50
            const topRes = await api.get('/progress/leaderboard?start=1&limit=50')
            if (!mounted) return
            const topEntries = topRes?.entries || []
            setItems(topEntries)
            setTotalCount(topRes?.total_count || null)

            // If current user not in top 50, fetch their personal rank and append below
            const isInTop = topEntries.some(e => e.id === user?.id)
            if (!isInTop) {
              const meRes = await api.get('/progress/leaderboard?around=true&limit=1')
              if (!mounted) return
              const meEntry = (meRes?.entries && meRes.entries.length > 0) ? meRes.entries[0] : null
              if (meEntry) {
                setItems(prev => [...prev, { ...meEntry, is_current_user: true }])
                setCurrentRank(meRes?.current_user_rank || null)
              }
            } else {
              // if in top, set current rank from top entries
              const me = topEntries.find(e => e.id === user?.id)
              if (me) setCurrentRank(me.rank)
            }
          } catch (e) {
            console.error('Error loading leaderboard', e)
            if (mounted) setError('Failed to load leaderboard')
          } finally {
            if (mounted) setLoading(false)
          }
        }
        fetchLeaderboard()
        return () => { mounted = false }
      }, [])

      const colors = ['bg-amber-300','bg-emerald-300','bg-sky-300','bg-pink-300','bg-violet-300']

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

          <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#ffba5a,#ff7a18)' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2l3 4h4v6c0 5-3 9-7 10-4-1-7-5-7-10V6h4l3-4z" fill="#fff" opacity="0.95" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-semibold tracking-widest">RANKING TOP 50</div>
                    <div className="text-sm font-bold">Top 50 · <span className="text-gray-400 font-medium">Updated live</span></div>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="p-4">
              <div className="text-xs text-gray-400 mb-3">
                {items && items.length > 0 ? (
                  `Top ${items.length >= 50 ? '1–50' : `${items[0].rank}–${items[items.length-1].rank}`}${totalCount ? ` · ${totalCount} users` : ''}`
                ) : 'Leaderboard'}
              </div>
              <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-100 shadow-sm">
                {loading ? (
                  <div className="p-6 flex items-center justify-center text-sm text-gray-500">Loading…</div>
                ) : error ? (
                  <div className="p-6 text-sm text-red-500">{error}</div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {items.map((it, idx) => {
                      const isCurrent = it.id === user?.id || it.is_current_user
                      return (
                        <li key={it.id} className={"flex items-center justify-between px-4 py-3 gap-3 " + (isCurrent ? 'bg-gray-100 rounded-lg mx-2 my-2' : '')}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="text-sm text-gray-400 w-6 text-right">{it.rank}</div>
                            <div className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold ${colors[idx % colors.length]}`}>
                              {String(it.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{it.username}</div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 font-medium">{it.xp} XP</div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t flex items-center justify-between">
              <div className="text-sm text-gray-500">{currentRank ? `Your rank: #${currentRank}` : 'Leaderboard' }</div>
              <div>
                <button onClick={onClose} className="px-3 py-2 bg-emerald-500 text-white rounded-lg shadow-sm font-semibold">Close</button>
              </div>
            </div>
          </div>
        </div>
      )
    }

// =============================================================================
// MAIN CONTENT COMPONENTS
// =============================================================================

/**
 * Extract color from gradient or solid color string
 */
function extractThemeColor(colorString) {
  if (!colorString) return '#deae1e' // Default primary color
  
  // If it's a hex color, return it directly
  if (colorString.startsWith('#')) return colorString
  
  // Try to extract from Tailwind gradient classes like "from-blue-500 to-blue-700"
  const colorMatch = colorString.match(/(?:from|to)-(\w+)-(\d+)/)
  if (colorMatch) {
    const [_, color, shade] = colorMatch
    // Map Tailwind colors to hex (common ones)
    const colorMap = {
      'blue': '#3b82f6',
      'purple': '#a855f7',
      'green': '#22c55e',
      'red': '#ef4444',
      'orange': '#f97316',
      'yellow': '#eab308',
      'pink': '#ec4899',
      'indigo': '#6366f1',
      'teal': '#14b8a6',
      'cyan': '#06b6d4',
    }
    return colorMap[color] || '#6366f1'
  }
  
  return '#6366f1' // Default
}

/**
 * Course Card - White background with theme color accents
 */
function CourseCard({ story }) {
  const progressValue = story.progress || 0
  const isStarted = progressValue > 0
  
  // Extract theme color from the story
  const themeColor = story.themeColor || extractThemeColor(story.color)
  
  // Determine if this is an in-progress or suggested course
  const isInProgress = story.status === 'in-progress'

  return (
    <Link to={`/course/${story.slug}`} className="block h-full group">
      <Card 
        className="relative overflow-hidden shadow-xl bg-white border-0 h-full hover:shadow-2xl transition-all duration-300 cursor-pointer"
        style={{ borderTop: `6px solid ${themeColor}` }}
      >
        {/* Decorative colored accent */}
        <div 
          className="absolute right-0 top-0 w-64 h-64 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"
          style={{ backgroundColor: themeColor }}
        />
        
        {/* Course Icon */}
         <img
          className="absolute right-20 top-8 opacity-5 select-none pointer-events-none"
          style={{
            filter: `drop-shadow(0 0 0 ${themeColor})`,
          }}
          src={story.illustration}
        />


        <CardContent className="relative z-10 p-8 space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge 
                className="border-0 font-bold text-xs text-white pointer-events-none"
                style={{ backgroundColor: themeColor }}
              >
                Level {story.level || 1}
              </Badge>
              {isInProgress && (
                <Badge 
                  variant="secondary"
                  className="border-0 font-bold text-xs bg-blue-100 text-blue-700 pointer-events-none"
                >
                  In Progress
                </Badge>
              )}
              {isStarted && (
                <Badge 
                  variant="secondary"
                  className="border font-bold text-xs pointer-events-none"
                  style={{ 
                    borderColor: themeColor,
                    color: themeColor,
                    backgroundColor: `${themeColor}10`
                  }}
                >
                  {progressValue}% Complete
                </Badge>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight line-clamp-2">
              {story.title}
            </h2>
            <p className="text-gray-600 text-base font-medium line-clamp-2">
              {story.description || 'Continue your learning journey'}
            </p>
          </div>

          {/* Progress Bar */}
          {isStarted && (
            <div className="space-y-2">
              <Progress 
                value={progressValue} 
                className="h-2.5 bg-gray-100"
                style={{ 
                  '--progress-color': themeColor 
                }}
              />
              <style>{`
                :global(.bg-gray-100 > div) {
                  background-color: var(--progress-color) !important;
                }
              `}</style>
            </div>
          )}

          {/* CTA Button - Now just visual, parent Link handles navigation */}
          <div 
            className={`cta-${story.slug} w-full md:w-auto font-bold text-base h-12 px-8 rounded-md border-2 flex items-center justify-center gap-2 transition-all duration-200 pointer-events-none`}
            style={{ 
              borderColor: themeColor,
              color: themeColor,
              backgroundColor: 'transparent'
            }}
          >
            {isStarted ? 'Continue' : 'Start Course'}
            <ArrowRight className="w-5 h-5" />
          </div>
          <style>{`
            .group:hover .cta-${story.slug} {
              background-color: ${themeColor} !important;
              color: white !important;
            }
          `}</style>
        </CardContent>
      </Card>
    </Link>
  )
}

/**
 * Stat Item Component
 */
function StatItem({ icon: Icon, label, value, color, bgColor }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-background/50">
      <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center mb-2`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
  )
}

/**
 * Achievement Item Component
 */
function AchievementItem({ icon, title, description, unlocked }) {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg ${unlocked ? 'opacity-100' : 'opacity-50'}`}>
      <div className="text-2xl">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      {unlocked && <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />}
    </div>
  )
}

/**
 * Quick Action Card Component
 */
function QuickActionCard({ icon: Icon, title, description, to, onClick }) {
  const content = (
    <Card className="hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer h-full">
      <CardContent className="p-4 space-y-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )

  if (onClick) {
    return (
      <div onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onClick() }}>
        {content}
      </div>
    )
  }

  return (
    <Link to={to}>
      {content}
    </Link>
  )
}

/**
 * Empty State - When no course started
 */
function EmptyStateCard() {
  return (
    <Card className="p-12 text-center border-2 border-dashed">
      <div className="space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <Target className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Ready to start?</h3>
          <p className="text-muted-foreground text-lg">Discover your first course and begin learning</p>
        </div>
        <Button asChild size="lg" className="w-full max-w-xs">
          <Link to="/explore">
            Explore courses
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </Button>
      </div>
    </Card>
  )
}

/**
 * Streak Card - Gamification (passive display)
 */
function StreakCard({ streak }) {
  const isOnFire = streak >= 7

  return (
    <Card className="border-2 border-orange-200/50 bg-gradient-to-br from-white to-orange-50/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
            isOnFire ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-orange-100'
          }`}>
            <Flame className={`w-7 h-7 ${isOnFire ? 'text-white' : 'text-orange-500'}`} />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground leading-none mb-1">{streak}</p>
            <p className="text-sm text-muted-foreground font-semibold">Day Streak</p>
          </div>
        </div>
        {streak > 0 && (
          <p className="text-sm text-orange-600 mt-3 font-bold">
            {isOnFire ? '🔥 You\'re on fire!' : '💪 Keep it going!'}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * League/XP Card
 */
function LeagueCard({ xp, league, rank, onViewLeaderboard = () => {} }) {
  const levelProgress = (xp % 100)
  const currentLevel = Math.floor(xp / 100)

  return (
    <Card className="border-2 border-purple-200/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="w-5 h-5 text-purple-600" />
          {league} League
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Rank</span>
          <span className="text-lg font-bold text-foreground">#{rank}</span>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground font-medium">Level {currentLevel}</span>
            <span className="font-bold text-foreground">{xp} XP</span>
          </div>
          <Progress value={levelProgress} className="h-2.5" />
          <p className="text-xs text-muted-foreground">{100 - levelProgress} XP to next level</p>
        </div>
        
        <Button variant="outline" size="sm" className="w-full mt-2" onClick={onViewLeaderboard}>
          View Leaderboard
        </Button>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// LANDING PAGE - For non-authenticated users
// =============================================================================

function Landing() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="max-w-2xl space-y-8">
        {/* Hero */}
        <div className="space-y-4">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Learn interactively
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            Master math through{' '}
            <span className="text-primary">problem solving</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto">
            Build real understanding with interactive lessons. 
            From calculus to linear algebra.
          </p>
        </div>

        {/* Single Primary CTA - Fitts's Law */}
        <div className="space-y-4">
          <Button asChild size="lg" className="h-14 px-8 text-base font-bold">
            <Link to="/register">
              Get started free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            No credit card required
          </p>
        </div>

        {/* Social proof - minimal */}
        <div className="flex items-center justify-center gap-6 pt-8 text-muted-foreground">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">10k+</p>
            <p className="text-sm">learners</p>
          </div>
          <Separator orientation="vertical" className="h-10" />
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">4.9</p>
            <p className="text-sm">rating</p>
          </div>
          <Separator orientation="vertical" className="h-10" />
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">50+</p>
            <p className="text-sm">courses</p>
          </div>
        </div>
      </div>
    </div>
  )
}
