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
  ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { useAuthStore } from '../lib/store'
import { encodeStepId, cn } from '../lib/utils'

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
      <div className="min-h-screen bg-stone-50">
        <header className="h-14 bg-white border-b border-stone-100 sticky top-0 z-30" />
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 lg:gap-8">
            <div className="h-80 animate-pulse bg-stone-200 rounded-2xl" />
            <div className="h-96 animate-pulse bg-stone-200 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-500 mb-4">Course not found</p>
          <Button asChild variant="outline">
            <Link to="/explore">Back to Explore</Link>
          </Button>
        </div>
      </div>
    )
  }

  const needsEnrollment = !story.is_enrolled

  return (
    <div className="min-h-screen bg-stone-50 pb-12">
      {/* Minimal Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0 text-stone-500 hover:text-stone-900 hover:bg-stone-100" asChild>
            <Link to="/explore">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-stone-900 truncate text-sm sm:text-base">{story.title}</h1>
          </div>
          {story.is_enrolled && (
            <Badge variant="secondary" className="shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200">
              {story.progress || 0}%
            </Badge>
          )}
        </div>
      </header>

      {/* Two-column layout */}
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 lg:gap-8 items-start">
          
          {/* Left Column - Static Course Overview Card */}
          <div className="lg:sticky lg:top-20">
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
          <div className="space-y-5">
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
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  const hasThumbnail = !!story.thumbnail_url
  
  return (
    <Card className="overflow-hidden border-stone-200 shadow-sm">
      {/* Course illustration / thumbnail */}
      <div className="aspect-[16/10] bg-gradient-to-br from-blue-100 via-indigo-50 to-violet-100 relative overflow-hidden">
        {hasThumbnail ? (
          <>
            {/* Thumbnail image */}
            <img 
              src={story.thumbnail_url} 
              alt={story.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Overlay gradient for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            {/* Badge positioned at bottom */}
            <div className="absolute bottom-3 left-3">
              <Badge variant="secondary" className="bg-white/95 backdrop-blur text-stone-700 border-0 shadow-sm">
                {story.difficulty || 'Beginner'}
              </Badge>
            </div>
          </>
        ) : (
          <>
            {/* Fallback gradient design */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.5),transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.1),transparent)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center relative z-10">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/90 backdrop-blur flex items-center justify-center mx-auto mb-3 shadow-lg border border-white/50"
                >
                  <span className="text-3xl sm:text-4xl">{story.icon || '📐'}</span>
                </motion.div>
                <Badge variant="secondary" className="bg-white/90 backdrop-blur text-stone-600 border-0 shadow-sm">
                  {story.difficulty || 'Beginner'}
                </Badge>
              </div>
            </div>
          </>
        )}
      </div>

      <CardHeader className="pb-2 px-4 sm:px-6">
        <CardTitle className="text-lg sm:text-xl text-stone-900">{story.title}</CardTitle>
        <CardDescription className="text-sm sm:text-base text-stone-500 leading-relaxed">
          {story.description || 'Master the fundamentals through interactive problem-solving.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 px-4 sm:px-6 pb-5">
        {/* Progress (if enrolled) */}
        {!needsEnrollment && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Progress</span>
              <span className="font-semibold text-stone-700">{completedLessons}/{totalLessons}</span>
            </div>
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
          </div>
        )}

        <Separator className="bg-stone-100" />

        {/* Meta stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-stone-50">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-base font-bold text-stone-900">{totalLessons}</p>
              <p className="text-xs text-stone-500">Lessons</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-stone-50">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-base font-bold text-stone-900">{story.duration || '2h'}</p>
              <p className="text-xs text-stone-500">Duration</p>
            </div>
          </div>
        </div>

        {/* Enrollment CTA (only if not enrolled) */}
        {needsEnrollment && (
          <>
            <Separator className="bg-stone-100" />
            <Button 
              onClick={onEnroll} 
              disabled={enrolling}
              className="w-full h-11 font-bold bg-stone-900 hover:bg-stone-800 text-white rounded-xl"
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
  const completedCount = steps.filter(s => s.is_completed).length
  
  return (
    <div className="space-y-3">
      {/* Level indicator */}
      <div className="flex items-center gap-2.5">
        <Badge variant="outline" className="px-3 py-1 text-xs font-bold uppercase tracking-wider border-stone-300 text-stone-600 bg-white">
          Level {index + 1}
        </Badge>
        <span className="text-stone-700 font-medium text-sm">{chapter.title}</span>
        <span className="text-xs text-stone-400 ml-auto">{completedCount}/{steps.length}</span>
      </div>

      {/* Lesson path container */}
      <Card className="p-3 sm:p-4 border-stone-200 shadow-sm">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[18px] sm:left-5 top-5 bottom-5 w-0.5 bg-stone-200" />
          
          {/* Lessons */}
          <div className="space-y-1.5">
            {steps.map((step, stepIndex) => {
              const isCurrentStep = currentLesson?.step?.id === step.id
              const isCompleted = step.is_completed
              const isLocked = !isEnrolled || (!isCompleted && !isCurrentStep)
              
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
    <motion.div 
      onClick={onSelect}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'relative flex items-center gap-3 p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer',
        isCurrent 
          ? 'bg-blue-50 ring-2 ring-blue-400 ring-offset-1' 
          : isCompleted
            ? 'bg-stone-50 hover:bg-stone-100'
            : 'hover:bg-stone-50',
        isLocked && 'opacity-50'
      )}
    >
      {/* Status icon */}
      <div className={cn(
        'relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-all',
        isCompleted 
          ? 'bg-emerald-500 text-white' 
          : isCurrent 
            ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' 
            : 'bg-stone-200 text-stone-400'
      )}>
        {isCompleted ? (
          <Check className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
        ) : isCurrent ? (
          <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" fill="currentColor" />
        ) : (
          <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        )}
      </div>

      {/* Lesson info */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-semibold truncate text-sm sm:text-base',
          isCompleted ? 'text-stone-500' : 'text-stone-800'
        )}>
          {step.title}
        </p>
        {step.duration && (
          <p className="text-xs text-stone-400 mt-0.5">{step.duration}</p>
        )}
      </div>

      {/* Current indicator */}
      {isCurrent && (
        <Badge className="shrink-0 bg-blue-500 text-white border-0 text-xs px-2">
          <Sparkles className="w-3 h-3 mr-1" />
          Next
        </Badge>
      )}

      {/* Chevron */}
      <ChevronRight className={cn(
        'w-4 h-4 shrink-0 transition-colors',
        isCurrent ? 'text-blue-400' : 'text-stone-300'
      )} />
    </motion.div>
  )
}

// =============================================================================
// ACTIVE LESSON CARD - Primary CTA area (Fitts's Law)
// =============================================================================

function ActiveLessonCard({ lesson, courseSlug }) {
  const slug = courseSlug || lesson?.story_slug
  return (
    <div className="mt-4 pt-4 border-t border-stone-100">
      <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 overflow-hidden">
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-500 flex items-center justify-center shrink-0 shadow-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Up next</p>
              <h3 className="text-base sm:text-lg font-bold text-stone-900 truncate mt-0.5">{lesson.title}</h3>
              {lesson.description && (
                <p className="text-sm text-stone-500 mt-1 line-clamp-2">
                  {lesson.description}
                </p>
              )}
            </div>
          </div>

          {/* Primary CTA - Continue button */}
          <Button 
            asChild 
            size="lg" 
            className="w-full h-11 sm:h-12 text-sm sm:text-base font-bold bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-sm"
          >
            <Link to={`/course/${slug}/step/${encodeStepId(lesson.id)}`} className="flex items-center justify-center gap-2">
              Continue
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// LESSON MODAL - Popup card when clicking a lesson
// =============================================================================

function LessonModal({ lesson, onClose, storySlug }) {
  if (!lesson) return null

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl max-w-sm w-full"
        >
          <div className="p-6 sm:p-8 space-y-5">
            {/* Status icon */}
            <div className="flex justify-center">
              <div className={cn(
                'w-14 h-14 rounded-2xl flex items-center justify-center',
                lesson.is_completed 
                  ? 'bg-emerald-100' 
                  : 'bg-blue-100'
              )}>
                {lesson.is_completed ? (
                  <Check className="w-7 h-7 text-emerald-600" />
                ) : (
                  <Play className="w-7 h-7 text-blue-600 ml-0.5" fill="currentColor" />
                )}
              </div>
            </div>

            {/* Title */}
            <h2 className="text-center text-xl sm:text-2xl font-bold text-stone-900">
              {lesson.title}
            </h2>
            
            {/* Description if available */}
            {lesson.description && (
              <p className="text-center text-stone-500 text-sm leading-relaxed">
                {lesson.description}
              </p>
            )}
            
            {/* Start Button */}
            <Button 
              asChild 
              size="lg" 
              className="w-full h-11 sm:h-12 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl"
            >
              <Link to={`/course/${storySlug}/step/${encodeStepId(lesson.id)}`} onClick={onClose}>
                {lesson.is_completed ? 'Review' : 'Start'}
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
