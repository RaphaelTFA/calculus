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
  ChevronRight,
  X
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
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
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
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 lg:gap-10 items-start">
          
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
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  // Fallback: illustration, then thumbnail, then icon
  let illustrationUrl = story.illustration;
  if (!illustrationUrl && story.thumbnail_url) illustrationUrl = story.thumbnail_url;
  // Use a friendlier, round font (e.g. font-sans, font-[Quicksand] if available)
  return (
    <div className="group relative cursor-pointer select-none" tabIndex={0} role="button">
      <Card className="overflow-hidden border-0 shadow-lg bg-white rounded-3xl transition-all duration-200 group-hover:shadow-xl group-hover:scale-[1.02] focus:shadow-xl focus:scale-[1.02] font-sans text-left">
        <div className="flex flex-col items-start pt-8 pb-4 px-8">
          <div className="w-24 h-24 rounded-2xl bg-[#F4F8FF] flex items-center justify-center mb-6 shadow-sm">
            {illustrationUrl ? (
              <img
                src={illustrationUrl}
                alt={story.title}
                className="w-20 h-20 object-contain rounded-xl"
                loading="lazy"
                draggable="false"
                onError={e => { e.target.style.display = 'none'; }}
              />
            ) : (
              <span className="text-5xl text-blue-500">{story.icon || '📐'}</span>
            )}
          </div>
          <h2 className="text-2xl font-extrabold text-stone-900 mb-2 leading-tight tracking-tight">{story.title}</h2>
          <p className="text-stone-500 text-lg mb-3 leading-relaxed max-w-[90%]">
            {story.description || 'Master the fundamentals through interactive problem-solving.'}
          </p>
          <div className="flex gap-2 mb-4">
            <Badge variant="outline" className="text-sm font-semibold text-stone-500 border-stone-200 px-3 py-1 rounded-full">
              {story.difficulty || 'Beginner'}
            </Badge>
          </div>
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2 text-stone-600">
              <Layers className="w-5 h-5 text-blue-400" />
              <span className="text-base font-bold text-stone-900">{totalLessons}</span>
              <span className="text-base text-stone-500">Lessons</span>
            </div>
            <div className="flex items-center gap-2 text-stone-600">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span className="text-base font-bold text-stone-900">{story.exercises || 0}</span>
              <span className="text-base text-stone-500">Exercises</span>
            </div>
          </div>
          {/* Progress bar if enrolled */}
          {!needsEnrollment && (
            <div className="w-full mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-base font-bold text-emerald-600">{progressPercent}%</span>
                <span className="text-base text-stone-400">{completedLessons} / {totalLessons}</span>
              </div>
              <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>
          )}
          {/* CTA button */}
          <Button
            onClick={onEnroll}
            disabled={enrolling || !needsEnrollment}
            className={cn(
              'w-full h-12 mt-2 font-bold rounded-xl text-lg transition-all',
              needsEnrollment
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow'
                : 'bg-stone-200 text-stone-500 cursor-default pointer-events-none'
            )}
          >
            {needsEnrollment
              ? enrolling
                ? 'Enrolling...'
                : user
                  ? 'Bắt đầu'
                  : 'Đăng nhập để học'
              : 'Đã tham gia'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// =============================================================================
// RIGHT COLUMN - Chapter Section with Lesson Path
// =============================================================================

function ChapterSection({ chapter, index, isEnrolled, currentLesson, storySlug }) {
  const [selectedLesson, setSelectedLesson] = useState(null) // { step, isLocked }
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
                  onSelect={() => setSelectedLesson({ step, isLocked })}
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
      <LessonModal 
        lesson={selectedLesson?.step} 
        isLocked={selectedLesson?.isLocked}
        onClose={() => setSelectedLesson(null)} 
        storySlug={storySlug} 
      />
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
          : 'bg-stone-50 hover:bg-stone-100'
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

function LessonModal({ lesson, isLocked, onClose, storySlug }) {
  if (!lesson) return null

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden relative"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-stone-500" />
          </button>

          {/* Decorative header gradient */}
          <div className={cn(
            'h-24 relative overflow-hidden',
            isLocked
              ? 'bg-gradient-to-br from-stone-100 to-stone-200'
              : lesson.is_completed 
                ? 'bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-100' 
                : 'bg-gradient-to-br from-blue-100 via-indigo-50 to-violet-100'
          )}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.6),transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.08),transparent)]" />
          </div>

          {/* Status icon - overlapping header */}
          <div className="flex justify-center -mt-10 relative z-10">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
              className={cn(
                'w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg border-4 border-white',
                isLocked
                  ? 'bg-stone-100'
                  : lesson.is_completed 
                    ? 'bg-emerald-500' 
                    : 'bg-blue-500'
              )}
            >
              {isLocked ? (
                <Lock className="w-8 h-8 text-stone-400" />
              ) : lesson.is_completed ? (
                <Check className="w-8 h-8 text-white" strokeWidth={2.5} />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
              )}
            </motion.div>
          </div>

          <div className="p-6 pt-4 space-y-4">
            {/* Status badge */}
            <div className="flex justify-center">
              <Badge 
                variant="secondary" 
                className={cn(
                  'text-xs font-semibold px-3 py-1',
                  isLocked
                    ? 'bg-stone-100 text-stone-500'
                    : lesson.is_completed 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-blue-100 text-blue-700'
                )}
              >
                {isLocked ? 'Locked' : lesson.is_completed ? 'Completed' : 'Ready to learn'}
              </Badge>
            </div>

            {/* Title */}
            <h2 className="text-center text-xl sm:text-2xl font-bold text-stone-900 leading-tight">
              {lesson.title}
            </h2>
            
            {/* Description or locked message */}
            {isLocked ? (
              <p className="text-center text-stone-500 text-sm leading-relaxed">
                Complete the previous lessons to unlock this one.
              </p>
            ) : lesson.description ? (
              <p className="text-center text-stone-500 text-sm leading-relaxed line-clamp-3">
                {lesson.description}
              </p>
            ) : null}

            {/* Duration info */}
            {lesson.duration && !isLocked && (
              <div className="flex justify-center">
                <div className="flex items-center gap-1.5 text-stone-400 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{lesson.duration}</span>
                </div>
              </div>
            )}
            
            {/* Action Button */}
            <div className="pt-2">
              {isLocked ? (
                <Button 
                  disabled
                  size="lg" 
                  className="w-full h-12 bg-stone-100 text-stone-400 font-bold rounded-xl cursor-not-allowed"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Locked
                </Button>
              ) : (
                <Button 
                  asChild 
                  size="lg" 
                  className={cn(
                    'w-full h-12 font-bold rounded-xl transition-all',
                    lesson.is_completed 
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-200'
                  )}
                >
                  <Link to={`/course/${storySlug}/step/${encodeStepId(lesson.id)}`} onClick={onClose}>
                    {lesson.is_completed ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Review Lesson
                      </>
                    ) : (
                      <>
                        Start Lesson
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
