import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Lock, 
  Check, 
  Play, 
  BookOpen, 
  Clock, 
  Layers,
  Sparkles,
  ArrowRight,
  Circle
} from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../lib/store'
import { encodeStepId } from '../lib/utils'

// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Separator } from '../components/ui/separator'

export default function Story() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [story, setStory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const { user } = useAuthStore()

  useEffect(() => {
    loadStory()
  }, [slug])

  const loadStory = async () => {
    try {
      const data = await api.get(`/stories/${slug}`)
      setStory(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    
    setEnrolling(true)
    try {
      await api.post(`/stories/${slug}/enroll`)
      await loadStory()
    } catch (e) {
      console.error(e)
    } finally {
      setEnrolling(false)
    }
  }

  // Calculate stats
  const totalLessons = story?.chapters?.reduce((acc, ch) => acc + (ch.steps?.length || 0), 0) || 0
  const completedLessons = story?.chapters?.reduce((acc, ch) => 
    acc + (ch.steps?.filter(s => s.is_completed).length || 0), 0) || 0
  
  // Find current lesson
  const findCurrentLesson = () => {
    if (!story?.chapters) return null
    for (const chapter of story.chapters) {
      for (const step of chapter.steps || []) {
        if (step.is_current || (!step.is_completed && story.is_enrolled)) {
          return { step, chapter }
        }
      }
    }
    return null
  }
  
  const currentLesson = findCurrentLesson()

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="h-14 bg-card border-b sticky top-0 z-30" />
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
            <Card className="h-80 animate-pulse bg-muted" />
            <Card className="h-96 animate-pulse bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    )
  }

  const needsEnrollment = !story.is_enrolled

  return (
    <div className="min-h-screen bg-white pb-8">
      {/* Minimal Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b">
        <div className="container max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/explore">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-foreground truncate">{story.title}</h1>
          </div>
          {story.is_enrolled && (
            <Badge variant="secondary" className="shrink-0">
              {story.progress || 0}% complete
            </Badge>
          )}
        </div>
      </header>

      {/* Two-column layout */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8 items-start">
          
          {/* Left Column - Static Course Overview Card */}
          <div className="lg:sticky lg:top-24">
            <CourseOverviewCard 
              story={story} 
              totalLessons={totalLessons}
              completedLessons={completedLessons}
              needsEnrollment={needsEnrollment}
              onEnroll={handleEnroll}
              enrolling={enrolling}
              user={user}
            />
          </div>

          {/* Right Column - Lesson Path + Active Lesson Card */}
          <div className="space-y-6">
            {story.chapters?.map((chapter, cIndex) => (
              <ChapterSection 
                key={chapter.id} 
                chapter={chapter} 
                index={cIndex}
                isEnrolled={story.is_enrolled}
                currentLesson={currentLesson}
                storySlug={slug}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// LEFT COLUMN - Course Overview Card (No CTA, informational only)
// =============================================================================

function CourseOverviewCard({ story, totalLessons, completedLessons, needsEnrollment, onEnroll, enrolling, user }) {
  return (
    <Card className="overflow-hidden">
      {/* Course illustration placeholder */}
      <div className="aspect-[4/3] bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent)]" />
        <div className="text-center relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-white/80 backdrop-blur flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-4xl">{story.icon || '📐'}</span>
          </div>
          <Badge variant="secondary" className="bg-white/80 backdrop-blur">
            {story.difficulty || 'Beginner'}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{story.title}</CardTitle>
        <CardDescription className="text-base">
          {story.description || 'Master the fundamentals through interactive problem-solving.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress (if enrolled) */}
        {!needsEnrollment && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{completedLessons}/{totalLessons} lessons</span>
            </div>
            <Progress value={story.progress || 0} className="h-2" />
          </div>
        )}

        <Separator />

        {/* Meta stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{totalLessons}</p>
              <p className="text-xs text-muted-foreground">Lessons</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{story.duration || '2h'}</p>
              <p className="text-xs text-muted-foreground">Duration</p>
            </div>
          </div>
        </div>

        {/* Enrollment CTA (only if not enrolled) */}
        {needsEnrollment && (
          <>
            <Separator />
            <Button 
              onClick={onEnroll} 
              disabled={enrolling}
              className="w-full h-12 font-bold"
            >
              {enrolling ? 'Enrolling...' : user ? 'Start Learning' : 'Sign in to Start'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// RIGHT COLUMN - Chapter Section with Lesson Path
// =============================================================================

function ChapterSection({ chapter, index, isEnrolled, currentLesson, storySlug }) {
  const [selectedLesson, setSelectedLesson] = useState(null)
  const steps = chapter.steps || []
  
  return (
    <div className="space-y-4">
      {/* Level indicator pill */}
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="px-4 py-1.5 text-sm font-bold uppercase tracking-wider">
          Level {index + 1}
        </Badge>
        <span className="text-muted-foreground font-medium">{chapter.title}</span>
      </div>

      {/* Lesson path container */}
      <Card className="p-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-border" />
          
          {/* Lessons */}
          <div className="space-y-2">
            {steps.map((step, stepIndex) => {
              const isCurrentStep = currentLesson?.step?.id === step.id
              const isCompleted = step.is_completed
              const isLocked = !isCompleted && !isCurrentStep
              
              return (
                <LessonNode
                  key={step.id}
                  step={step}
                  isCompleted={isCompleted}
                  isCurrent={isCurrentStep}
                  isLocked={isLocked}
                  isEnrolled={isEnrolled}
                  isLast={stepIndex === steps.length - 1}
                  onSelect={() => setSelectedLesson(step)}
                />
              )
            })}
          </div>
        </div>

        {/* Active lesson card - appears at bottom if current lesson is in this chapter */}
        {currentLesson?.chapter?.id === chapter.id && (
          <ActiveLessonCard lesson={currentLesson.step} courseSlug={storySlug} />
        )}
      </Card>

      {/* Lesson Modal */}
      <LessonModal lesson={selectedLesson} onClose={() => setSelectedLesson(null)} storySlug={storySlug} />
    </div>
  )
}

// =============================================================================
// LESSON NODE - Individual lesson in the path
// =============================================================================

function LessonNode({ step, isCompleted, isCurrent, isLocked, isEnrolled, onSelect }) {
  return (
    <div 
      onClick={onSelect}
      className={`relative flex items-center gap-4 p-3 rounded-xl transition-all cursor-pointer hover:bg-primary/5 ${
        isCurrent 
          ? 'bg-primary-50 ring-2 ring-primary ring-offset-2' 
          : isCompleted
            ? 'bg-muted/50'
            : 'opacity-60'
      }`}>
      {/* Status icon */}
      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
        isCompleted 
          ? 'bg-green-500 text-white' 
          : isCurrent 
            ? 'bg-primary text-white shadow-lg shadow-primary/30' 
            : 'bg-muted text-muted-foreground'
      }`}>
        {isCompleted ? (
          <Check className="w-5 h-5" />
        ) : isCurrent ? (
          <Play className="w-5 h-5" fill="currentColor" />
        ) : (
          <Lock className="w-4 h-4" />
        )}
      </div>

      {/* Lesson info */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold truncate ${
          isCompleted ? 'text-muted-foreground' : 'text-foreground'
        }`}>
          {step.title}
        </p>
        {step.duration && (
          <p className="text-xs text-muted-foreground">{step.duration}</p>
        )}
      </div>

      {/* Current indicator */}
      {isCurrent && (
        <Badge variant="default" className="shrink-0 bg-primary">
          <Sparkles className="w-3 h-3 mr-1" />
          Current
        </Badge>
      )}
    </div>
  )
}

// =============================================================================
// ACTIVE LESSON CARD - Primary CTA area (Fitts's Law)
// =============================================================================

function ActiveLessonCard({ lesson, courseSlug }) {
  const slug = courseSlug || lesson?.story_slug
  return (
    <div className="mt-6 pt-6 border-t">
      <Card className="border-primary/20 bg-gradient-to-br from-primary-50/50 to-white overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground font-medium">Up next</p>
              <h3 className="text-lg font-bold text-foreground truncate">{lesson.title}</h3>
              {lesson.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {lesson.description}
                </p>
              )}
            </div>
          </div>

          {/* Primary CTA - Continue button */}
          {/* Fitts's Law: Large, full-width, bottom-positioned */}
          <Button 
            asChild 
            size="lg" 
            className="w-full h-14 text-base font-bold"
          >
            <Link to={`/course/${slug}/step/${encodeStepId(lesson.id)}`} className="flex items-center justify-center gap-2">
              Continue
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// LESSON MODAL - Popup card when clicking a lesson
// =============================================================================

function LessonModal({ lesson, onClose, storySlug }) {
  if (!lesson) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
          <div className="p-8 space-y-6">
            {/* Title - bold black at top center */}
            <h2 className="text-center text-2xl font-bold text-black">
              {lesson.title}
            </h2>
            
            {/* Description if available */}
            {lesson.description && (
              <p className="text-center text-gray-600 text-sm">
                {lesson.description}
              </p>
            )}
            
            {/* Start Button - large blue rounded */}
            <Button 
              asChild 
              size="lg" 
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl"
            >
              <Link to={`/course/${storySlug}/step/${encodeStepId(lesson.id)}`} onClick={onClose}>
                Bắt đầu
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
