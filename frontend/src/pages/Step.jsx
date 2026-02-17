import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Check, X, Sparkles, RotateCcw, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { useAuthStore } from '../lib/store'
import { decodeStepId, encodeStepId } from '../lib/utils'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

// shadcn/ui components
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'

export default function Step() {
  const { slug, encodedId } = useParams()
  const navigate = useNavigate()
  const id = decodeStepId(encodedId)
  const { user } = useAuthStore()

  const [step, setStep] = useState(null)
  const [slides, setSlides] = useState([])
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [story, setStory] = useState(null)
  const [allSteps, setAllSteps] = useState([])
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState({})
  const [quizResults, setQuizResults] = useState({}) // { blockId: { correct: bool, xp: number } }
  const [totalXpEarned, setTotalXpEarned] = useState(0)
  const [showCompleteScreen, setShowCompleteScreen] = useState(false)
  const [feedbackState, setFeedbackState] = useState(null) // { blockId, correct, xp, explanation }
  const [showExplanation, setShowExplanation] = useState(false)

  useEffect(() => {
    loadData()
  }, [id, slug])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load story data for navigation context
      const fullStory = await api.get(`/stories/${slug}`)
      setStory(fullStory)

      // Prevent accessing lesson content unless the course is started (enrolled)
      if (!fullStory.is_enrolled) {
        // redirect back to course page where user can enroll
        navigate(`/course/${slug}`)
        setLoading(false)
        return
      }

      const steps = []
      fullStory.chapters?.forEach(ch => {
        ch.steps?.forEach(s => {
          steps.push({ ...s, chapter_id: ch.id })
        })
      })
      setAllSteps(steps)

      // Load step details
      const stepData = await api.get(`/steps/${id}`)
      setStep(stepData)

      // Load slides
      const slidesData = await api.get(`/steps/${id}/slides`)
      setSlides(slidesData)
      setCurrentSlideIndex(0)
      setQuizAnswers({})
      setQuizSubmitted({})
    } catch (e) {
      console.error('Error loading step:', e)
    } finally {
      setLoading(false)
    }
  }

  const currentSlide = slides[currentSlideIndex]
  const progress = slides.length > 0 ? ((currentSlideIndex + 1) / slides.length) * 100 : 0

  const goToNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1)
    }
  }

  const goToPrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1)
    }
  }

  const handleComplete = async () => {
    // Show celebration screen first
    setShowCompleteScreen(true)
  }

  const handleCompleteAndNavigate = async () => {
    try {
      await api.post(`/steps/${id}/complete`, { score: 100 })
      // Navigate to next step or back to course
      const currentIdx = allSteps.findIndex(s => s.id === parseInt(id))
      if (currentIdx < allSteps.length - 1) {
        const nextStep = allSteps[currentIdx + 1]
        navigate(`/course/${slug}/step/${encodeStepId(nextStep.id)}`)
      } else {
        navigate(`/course/${slug}`)
      }
    } catch (e) {
      console.error('Error completing step:', e)
      // Still navigate even if completion fails
      navigate(`/course/${slug}`)
    }
  }

  const handleQuizAnswer = (blockId, answer) => {
    setQuizAnswers(prev => ({ ...prev, [blockId]: answer }))
  }

  const handleQuizSubmit = (blockId, isCorrect, explanation) => {
    const xpReward = isCorrect ? 15 : 0
    setQuizSubmitted(prev => ({ ...prev, [blockId]: true }))
    setQuizResults(prev => ({ ...prev, [blockId]: { correct: isCorrect, xp: xpReward } }))
    if (isCorrect) {
      setTotalXpEarned(prev => prev + xpReward)
    }
    setFeedbackState({ blockId, correct: isCorrect, xp: xpReward, explanation })
    setShowExplanation(false)
  }

  const handleFeedbackContinue = () => {
    const wasCorrect = feedbackState?.correct
    const blockId = feedbackState?.blockId
    
    setFeedbackState(null)
    setShowExplanation(false)
    
    if (wasCorrect) {
      // Only advance to next slide if answer was correct
      if (currentSlideIndex < slides.length - 1) {
        setCurrentSlideIndex(prev => prev + 1)
      }
    } else {
      // Reset quiz state to allow retry
      setQuizSubmitted(prev => ({ ...prev, [blockId]: false }))
      setQuizAnswers(prev => ({ ...prev, [blockId]: null }))
    }
  }

  const handleShowExplanation = () => {
    setShowExplanation(true)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        goToNextSlide()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPrevSlide()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSlideIndex, slides.length])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!step || slides.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center text-white">
          <p className="mb-4">No slides found for this step</p>
          <Button asChild variant="outline">
            <Link to={`/course/${slug}`}>Back to Course</Link>
          </Button>
        </div>
      </div>
    )
  }

  const isLastSlide = currentSlideIndex === slides.length - 1

  // Show completion celebration screen
  if (showCompleteScreen) {
    return (
      <CompleteScreen 
        xpEarned={totalXpEarned || (step?.xp_reward || 10)}
        stepTitle={step?.title}
        onContinue={handleCompleteAndNavigate}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <header className="h-14 bg-[#12121a] border-b border-white/10 flex items-center px-4 shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(`/course/${slug}`)}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="flex-1 ml-4">
          <h1 className="text-white font-medium truncate">{step.title}</h1>
          <p className="text-white/50 text-sm truncate">{story?.title}</p>
        </div>

        <div className="flex items-center gap-2 text-white/50 text-sm">
          <span>{currentSlideIndex + 1} / {slides.length}</span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-white/5">
        <div 
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Slide Content */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-auto pb-24">
        <div className="w-full max-w-3xl">
          <SlideRenderer 
            slide={currentSlide} 
            quizAnswers={quizAnswers}
            quizSubmitted={quizSubmitted}
            onQuizAnswer={handleQuizAnswer}
            onQuizSubmit={handleQuizSubmit}
          />
        </div>
      </main>

      {/* Feedback Panel - slides up from bottom */}
      <AnimatePresence>
        {feedbackState && (
          <FeedbackPanel
            correct={feedbackState.correct}
            xp={feedbackState.xp}
            explanation={feedbackState.explanation}
            showExplanation={showExplanation}
            onShowExplanation={handleShowExplanation}
            onContinue={handleFeedbackContinue}
          />
        )}
      </AnimatePresence>

      {/* Navigation - only show when no feedback panel */}
      {!feedbackState && (
        <footer className="h-20 bg-[#12121a] border-t border-white/10 flex items-center justify-between px-4 md:px-8 shrink-0">
          <Button
            variant="ghost"
            onClick={goToPrevSlide}
            disabled={currentSlideIndex === 0}
            className="text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </Button>

          <div className="flex gap-1">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentSlideIndex 
                    ? 'bg-blue-500 w-6' 
                    : idx < currentSlideIndex 
                      ? 'bg-blue-500/50' 
                      : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          {isLastSlide ? (
            <Button
              onClick={handleComplete}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Complete
              <Check className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={goToNextSlide}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          )}
        </footer>
      )}
    </div>
  )
}

// =============================================================================
// SLIDE RENDERER
// =============================================================================

function SlideRenderer({ slide, quizAnswers, quizSubmitted, onQuizAnswer, onQuizSubmit }) {
  if (!slide) return null

  return (
    <div className="space-y-6">
      {slide.blocks?.map((block, idx) => (
        <BlockRenderer 
          key={block.id || idx} 
          block={block}
          quizAnswers={quizAnswers}
          quizSubmitted={quizSubmitted}
          onQuizAnswer={onQuizAnswer}
          onQuizSubmit={onQuizSubmit}
        />
      ))}
    </div>
  )
}

// =============================================================================
// BLOCK RENDERER
// =============================================================================

function BlockRenderer({ block, quizAnswers, quizSubmitted, onQuizAnswer, onQuizSubmit }) {
  const type = block.type || block.block_type

  switch (type) {
    case 'text':
      return <TextBlock block={block} />
    case 'math':
      return <MathBlock block={block} />
    case 'image':
      return <ImageBlock block={block} />
    case 'quiz':
      return (
        <QuizBlock 
          block={block}
          answer={quizAnswers[block.id]}
          submitted={quizSubmitted[block.id]}
          onAnswer={(ans) => onQuizAnswer(block.id, ans)}
          onSubmit={() => onQuizSubmit(block.id)}
        />
      )
    case 'code':
      return <CodeBlock block={block} />
    default:
      return <div className="text-white/50">Unknown block type: {type}</div>
  }
}

// =============================================================================
// TEXT BLOCK
// =============================================================================

function TextBlock({ block }) {
  const content = block.content || block.block_data || {}
  
  return (
    <div className="text-white space-y-3">
      {content.heading && (
        <h2 className="text-2xl md:text-3xl font-bold">{content.heading}</h2>
      )}
      {content.paragraphs?.map((p, idx) => (
        <p key={idx} className="text-lg text-white/80 leading-relaxed" 
           dangerouslySetInnerHTML={{ __html: formatText(p) }} />
      ))}
      {content.content && (
        <div className="text-lg text-white/80 leading-relaxed"
             dangerouslySetInnerHTML={{ __html: formatText(content.content) }} />
      )}
    </div>
  )
}

function formatText(text) {
  if (!text) return ''
  // Convert **bold** to <strong>
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  // Convert *italic* to <em>
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>')
  // Convert _italic_ to <em>
  text = text.replace(/_(.*?)_/g, '<em>$1</em>')
  return text
}

// =============================================================================
// MATH BLOCK
// =============================================================================

function MathBlock({ block }) {
  const content = block.content || block.block_data || {}
  const latex = content.latex || ''
  const displayMode = content.display_mode !== 'inline'

  try {
    return (
      <div className="text-white text-center py-4">
        {displayMode ? (
          <BlockMath math={latex} />
        ) : (
          <InlineMath math={latex} />
        )}
      </div>
    )
  } catch (e) {
    return <div className="text-red-400">Error rendering math: {latex}</div>
  }
}

// =============================================================================
// IMAGE BLOCK
// =============================================================================

function ImageBlock({ block }) {
  const content = block.content || block.block_data || {}
  
  return (
    <div className="flex flex-col items-center gap-2">
      <img 
        src={content.src} 
        alt={content.alt || ''} 
        className="max-w-full rounded-lg"
      />
      {content.caption && (
        <p className="text-white/50 text-sm">{content.caption}</p>
      )}
    </div>
  )
}

// =============================================================================
// CODE BLOCK
// =============================================================================

function CodeBlock({ block }) {
  const content = block.content || block.block_data || {}
  
  return (
    <div className="rounded-lg overflow-hidden">
      <div className="bg-[#1e1e2e] px-4 py-2 text-white/50 text-sm border-b border-white/10">
        {content.language || 'code'}
      </div>
      <pre className="bg-[#1e1e2e] p-4 overflow-x-auto">
        <code className="text-green-400 text-sm font-mono">
          {content.code}
        </code>
      </pre>
    </div>
  )
}

// =============================================================================
// QUIZ BLOCK
// =============================================================================

function QuizBlock({ block, answer, submitted, onAnswer, onSubmit }) {
  const content = block.content || block.block_data || {}
  const question = content.question || ''
  const options = content.options || []
  const correctAnswer = content.correct
  const explanation = content.explanation

  const handleSubmit = () => {
    // Use loose comparison to handle type mismatches (string vs number)
    const isCorrect = String(answer) === String(correctAnswer)
    onSubmit(block.id, isCorrect, explanation)
  }

  // Use loose comparison for display as well
  const isCorrect = submitted && String(answer) === String(correctAnswer)

  return (
    <Card className="bg-[#1a1a2e] border-white/10 overflow-hidden">
      <CardContent className="p-6 space-y-4">
        {/* Question */}
        <div className="text-white text-lg font-medium">
          {question.includes('$') ? (
            <MathText text={question} />
          ) : (
            question
          )}
        </div>

        {/* Options */}
        <div className="space-y-2">
          {options.map((opt, idx) => {
            const optValue = opt.value || opt.id || idx
            const optLabel = opt.label || opt.text
            const isSelected = answer === optValue
            const showCorrect = submitted && String(optValue) === String(correctAnswer)
            const showWrong = submitted && isSelected && String(optValue) !== String(correctAnswer)

            return (
              <motion.button
                key={optValue}
                onClick={() => !submitted && onAnswer(optValue)}
                disabled={submitted}
                animate={showWrong ? { x: [0, -8, 8, -8, 8, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  showCorrect
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                    : showWrong
                      ? 'bg-red-500/10 border-red-400/50 text-red-400'
                      : isSelected
                        ? 'bg-blue-500/20 border-blue-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                    showCorrect ? 'border-emerald-500 bg-emerald-500 text-white' :
                    showWrong ? 'border-red-400 bg-red-500/20' :
                    isSelected ? 'border-blue-500 bg-blue-500/20' : 'border-white/30'
                  }`}>
                    {showCorrect ? <Check className="w-4 h-4" /> : 
                     showWrong ? <X className="w-4 h-4" /> : 
                     String.fromCharCode(65 + idx)}
                  </span>
                  {optLabel}
                </span>
              </motion.button>
            )
          })}
        </div>

        {/* Submit button */}
        {!submitted && answer && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button 
              onClick={handleSubmit}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-semibold text-base"
            >
              Check Answer
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}

// =============================================================================
// FEEDBACK PANEL - Slides up from bottom
// =============================================================================

function FeedbackPanel({ correct, xp, explanation, showExplanation, onShowExplanation, onContinue }) {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`fixed bottom-0 left-0 right-0 z-50 ${
        correct ? 'bg-emerald-500' : 'bg-[#3a3a4a]'
      }`}
    >
      <div className="max-w-3xl mx-auto px-4 py-5">
        {/* Main feedback row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Icon */}
            {correct ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-white/70" />
              </div>
            )}
            
            {/* Text */}
            <div>
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-white font-bold text-lg"
              >
                {correct ? 'Correct!' : 'Incorrect'}
              </motion.p>
              {correct && xp > 0 && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-white/90 text-sm font-medium"
                >
                  +{xp} XP
                </motion.p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {explanation && (
              <Button
                variant="ghost"
                onClick={onShowExplanation}
                className={`${correct ? 'text-white/80 hover:text-white hover:bg-white/10' : 'bg-white/10 text-white hover:bg-white/20'} font-medium`}
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                Why?
              </Button>
            )}
            <Button
              onClick={onContinue}
              className={`font-bold px-6 ${
                correct 
                  ? 'bg-white text-emerald-600 hover:bg-white/90' 
                  : 'bg-white/90 text-gray-800 hover:bg-white'
              }`}
            >
              {correct ? 'Continue' : 'Try Again'}
            </Button>
          </div>
        </div>

        {/* Explanation (expandable) */}
        <AnimatePresence>
          {showExplanation && explanation && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className={`mt-4 p-4 rounded-xl ${correct ? 'bg-white/10' : 'bg-white/5'}`}>
                <p className="text-white/90 text-sm leading-relaxed">
                  {explanation}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// =============================================================================
// COMPLETE SCREEN - Celebration
// =============================================================================

function CompleteScreen({ xpEarned, stepTitle, onContinue }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white flex flex-col items-center justify-center p-8"
    >
      {/* Floating shapes decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-16 h-16 bg-blue-100 rounded-2xl"
        />
        <motion.div
          animate={{ y: [0, 15, 0], rotate: [0, -15, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
          className="absolute top-1/3 right-1/4 w-12 h-12 bg-emerald-100 rounded-full"
        />
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, 20, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: 1 }}
          className="absolute bottom-1/3 left-1/3 w-10 h-10 bg-amber-100 rounded-xl"
        />
        <motion.div
          animate={{ y: [0, 12, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, delay: 0.3 }}
          className="absolute top-1/2 right-1/3 w-8 h-8 bg-purple-100 rounded-lg"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-8">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/30"
        >
          <Check className="w-12 h-12 text-white" strokeWidth={3} />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Lesson complete!
          </h1>
          <p className="text-gray-500 text-lg">
            Nice — let's keep the momentum going
          </p>
        </motion.div>

        {/* XP Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="py-6"
        >
          <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">
            Total XP
          </p>
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ delay: 0.7, duration: 0.3 }}
            className="relative inline-block"
          >
            <span className="text-6xl md:text-7xl font-bold text-gray-900">
              {xpEarned}
            </span>
            <span className="text-2xl md:text-3xl font-bold text-emerald-500 ml-2">
              brain cells activated!
            </span>
            {/* Sparkle effect */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-6 h-6 text-amber-400" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="pt-4"
        >
          <Button
            onClick={onContinue}
            className="h-14 px-12 text-lg font-bold bg-gray-900 hover:bg-gray-800 text-white rounded-2xl shadow-lg"
          >
            Continue
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}

// Helper to render text with inline math
function MathText({ text }) {
  const parts = text.split(/(\$[^$]+\$)/g)
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const latex = part.slice(1, -1)
          return <InlineMath key={idx} math={latex} />
        }
        return <span key={idx}>{part}</span>
      })}
    </>
  )
}
