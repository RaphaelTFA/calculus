import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Flame, 
  Zap, 
  Trophy, 
  Crown, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Target
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
  const [currentStory, setCurrentStory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const data = await api.get('/progress/dashboard')
      setCurrentStory(data?.current_story)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated()) {
    return <Landing />
  }

  return (
    <div className="min-h-screen">
      {/* 2-Column Responsive Layout */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
        
        {/* Left Sidebar - Secondary Content (Informational only) */}
        <aside className="order-2 lg:order-1 space-y-4">
          {/* Learning Streak Card */}
          <StreakCard streak={user?.current_streak || 0} />
          
          {/* Energy / Lives Indicator */}
          <EnergyCard energy={5} maxEnergy={5} />
          
          {/* XP / League Progress */}
          <LeagueCard xp={user?.xp || 0} league="Silver" rank={12} />
          
          {/* Premium Upsell Card */}
          <PremiumCard />
        </aside>

        {/* Main Content Area - Primary Focus */}
        <main className="order-1 lg:order-2 space-y-6">
          {/* Friendly Greeting - Minimal */}
          <div className="flex items-center gap-3">
            <span className="text-2xl">👋</span>
            <div>
              <p className="text-muted-foreground font-medium">Nice work today</p>
              <h1 className="text-xl font-bold text-foreground">
                Welcome back, {user?.display_name || user?.username}
              </h1>
            </div>
          </div>

          {/* Current Course Card - Primary CTA Area */}
          {loading ? (
            <Card className="h-80 animate-pulse bg-muted" />
          ) : currentStory ? (
            <CurrentCourseCard story={currentStory} />
          ) : (
            <EmptyStateCard />
          )}

          {/* Lesson Status - Completed feedback */}
          <LessonFeedback completedToday={currentStory?.lessons_completed_today || 1} />
        </main>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN CONTENT COMPONENTS
// =============================================================================

/**
 * Current Course Card - Primary Focus
 * UX: One screen → one action (Cognitive Load Theory)
 * Fitts's Law: Large, isolated primary CTA at bottom
 */
function CurrentCourseCard({ story }) {
  const progressValue = story.progress || 0

  return (
    <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary-500 to-primary-700">
      {/* Course Illustration Placeholder */}
      <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 flex items-center justify-center">
        <div className="text-[180px] text-white/20">{story.icon || '∫'}</div>
      </div>

      <CardHeader className="relative z-10 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="bg-white/20 text-white border-0 font-semibold">
            In Progress
          </Badge>
          <Badge variant="secondary" className="bg-white/20 text-white border-0 font-semibold">
            Level {story.level || 1}
          </Badge>
        </div>
        <CardTitle className="text-3xl font-bold text-white">
          {story.title}
        </CardTitle>
        <CardDescription className="text-white/80 text-base font-medium">
          {story.description || 'Continue your learning journey'}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10 space-y-6">
        {/* Progress indicator with context */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-white/90 font-semibold">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {progressValue}% complete
            </span>
            <span>{story.lessons_remaining || 3} lessons left</span>
          </div>
          <Progress 
            value={progressValue} 
            className="h-3 bg-white/20"
            indicatorClassName="bg-white"
          />
        </div>

        {/* Primary CTA - Full width, large, high contrast */}
        {/* Fitts's Law: Easiest action to hit */}
        <Button 
          asChild 
          size="lg" 
          className="w-full bg-white text-primary-600 hover:bg-white/90 font-bold text-base h-14 shadow-lg"
        >
          <Link to={`/story/${story.slug}`} className="flex items-center justify-center gap-2">
            Continue course
            <ArrowRight className="w-5 h-5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

/**
 * Empty State - When no course started
 */
function EmptyStateCard() {
  return (
    <Card className="p-8 text-center border-2 border-dashed">
      <div className="space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary-50 flex items-center justify-center">
          <Target className="w-8 h-8 text-primary-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">Ready to start?</h3>
          <p className="text-muted-foreground">Discover your first course</p>
        </div>
        <Button asChild size="lg" className="w-full max-w-xs">
          <Link to="/explore">
            Explore courses
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </Card>
  )
}

/**
 * Lesson Feedback - Short, icon-based
 * Cognitive Load: Icons instead of text, short feedback
 */
function LessonFeedback({ completedToday }) {
  if (completedToday === 0) return null

  return (
    <Card className="border-green-100 bg-green-50/50">
      <CardContent className="flex items-center gap-3 py-4">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-green-800">
            {completedToday === 1 ? 'Lesson completed' : `${completedToday} lessons completed`}
          </p>
          <p className="text-sm text-green-600">Great progress today!</p>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// SIDEBAR COMPONENTS - Informational only, visually muted
// =============================================================================

/**
 * Streak Card - Gamification (passive display)
 * Rule: Passive display only, no interruptions
 */
function StreakCard({ streak }) {
  const isOnFire = streak >= 7

  return (
    <Card className="border-streak-light/50 bg-gradient-to-br from-white to-orange-50/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isOnFire ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-orange-100'
          }`}>
            <Flame className={`w-6 h-6 ${isOnFire ? 'text-white' : 'text-orange-500'}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{streak}</p>
            <p className="text-sm text-muted-foreground font-medium">day streak</p>
          </div>
        </div>
        {streak > 0 && (
          <p className="text-xs text-orange-600 mt-3 font-medium">
            {isOnFire ? '🔥 On fire!' : 'Keep it up!'}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Energy Card - Lives/energy indicator
 * Rule: Accent color (lime) for motivation signals only
 */
function EnergyCard({ energy, maxEnergy }) {
  return (
    <Card className="border-energy-light/50 bg-gradient-to-br from-white to-lime-50/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-lime-100 flex items-center justify-center">
            <Zap className="w-6 h-6 text-lime-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">{energy}</span>
              <span className="text-sm text-muted-foreground">/ {maxEnergy}</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">energy</p>
          </div>
        </div>
        {/* Visual energy indicators */}
        <div className="flex gap-1.5 mt-3">
          {Array.from({ length: maxEnergy }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i < energy ? 'bg-lime-400' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
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
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="font-bold text-foreground">{league} League</p>
            <p className="text-sm text-muted-foreground">Rank #{rank}</p>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Level {currentLevel}</span>
            <span className="font-semibold text-foreground">{xp} XP</span>
          </div>
          <Progress value={levelProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">{100 - levelProgress} XP to level {currentLevel + 1}</p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Premium Upsell Card
 * Rule: Gradient accent card, non-intrusive
 */
function PremiumCard() {
  return (
    <Card className="border-0 bg-gradient-to-br from-violet-500 to-indigo-600 text-white overflow-hidden">
      <CardContent className="p-4 relative">
        {/* Decorative element */}
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -right-2 bottom-0 w-16 h-16 rounded-full bg-white/5" />
        
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-300" />
            <span className="font-bold">Go Premium</span>
          </div>
          <p className="text-sm text-white/80">
            Unlimited learning, no ads
          </p>
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-white/20 hover:bg-white/30 text-white border-0 font-semibold"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            Learn more
          </Button>
        </div>
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
