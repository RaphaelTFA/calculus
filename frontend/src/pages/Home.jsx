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
import { useAuthStore } from '../lib/store'
import api from '../lib/api'

// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Separator } from '../components/ui/separator'

export default function Home() {
  const { user, isAuthenticated } = useAuthStore()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const data = await api.get('/progress/dashboard')
      setDashboardData(data)
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
        
        {/* Left Sidebar - Enhanced with more features */}
        <aside className="order-2 lg:order-1 space-y-4">
          {/* User Stats Overview */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <StatItem icon={Flame} label="Streak" value={`${user?.current_streak || 0}d`} color="text-orange-600" bgColor="bg-orange-100" />
                <StatItem icon={Zap} label="XP" value={user?.xp || 0} color="text-yellow-600" bgColor="bg-yellow-100" />
                <StatItem icon={Trophy} label="Rank" value={dashboardData?.rank ? `#${dashboardData.rank}` : '-'} color="text-purple-600" bgColor="bg-purple-100" />
                <StatItem icon={BookOpen} label="Lessons" value={dashboardData?.lessons_completed || 0} color="text-blue-600" bgColor="bg-blue-100" />
              </div>
            </CardContent>
          </Card>

          {/* Daily Goal */}
          {dashboardData?.daily_goal && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Daily Goal
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {dashboardData.daily_goal.completed}/{dashboardData.daily_goal.target}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress 
                  value={(dashboardData.daily_goal.completed / dashboardData.daily_goal.target) * 100} 
                  className="h-2" 
                />
                <p className="text-xs text-muted-foreground">
                  {dashboardData.daily_goal.remaining > 0 
                    ? `${dashboardData.daily_goal.remaining} more lesson${dashboardData.daily_goal.remaining !== 1 ? 's' : ''} to reach your daily goal!`
                    : 'Daily goal completed! 🎉'
                  }
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* Learning Streak Card */}
          <StreakCard streak={user?.current_streak || 0} />
          
          {/* Achievements Preview */}
          {dashboardData?.recent_achievements && dashboardData.recent_achievements.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Recent Achievements
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
          
          {/* XP / League Progress */}
          {dashboardData?.league && (
            <LeagueCard 
              xp={user?.xp || 0} 
              league={dashboardData.league} 
              rank={dashboardData.rank || 0} 
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
                  className="flex gap-4"
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
              to="/profile"
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
        <div 
          className="absolute right-8 top-8 text-[120px] opacity-5 font-bold select-none pointer-events-none"
          style={{ color: themeColor }}
        >
          {story.icon || '∫'}
        </div>

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
              <style jsx>{`
                :global(.bg-gray-100 > div) {
                  background-color: var(--progress-color) !important;
                }
              `}</style>
              <p className="text-sm text-gray-600 font-semibold">
                {story.lessons_remaining || 0} lessons remaining
              </p>
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
function QuickActionCard({ icon: Icon, title, description, to }) {
  return (
    <Link to={to}>
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
function LeagueCard({ xp, league, rank }) {
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
        
        <Button variant="outline" size="sm" className="w-full mt-2">
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
