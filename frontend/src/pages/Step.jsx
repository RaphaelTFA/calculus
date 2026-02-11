import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  X as XIcon, Check, Sparkles, RotateCcw, HelpCircle,
  Eye,
  Lightbulb, AlertTriangle, Info, GraduationCap,
  Copy, CheckCheck, Play, GripVertical
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'
import { useAuthStore } from '../lib/store'
import { decodeStepId, encodeStepId, cn } from '../lib/utils'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

import { Button } from '../components/ui/button'

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function Step() {
  const { slug, encodedId } = useParams()
  const navigate = useNavigate()
  const id = decodeStepId(encodedId)
  const { user } = useAuthStore()

  const [step, setStep] = useState(null)
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [story, setStory] = useState(null)
  const [allSteps, setAllSteps] = useState([])

  // Slide navigation
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

  // Quiz state: per-block
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState({})
  const [quizResults, setQuizResults] = useState({})
  const [totalXpEarned, setTotalXpEarned] = useState(0)

  const [showCompleteScreen, setShowCompleteScreen] = useState(false)

  useEffect(() => { loadData() }, [id, slug])

  const loadData = async () => {
    setLoading(true)
    try {
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
        ch.steps?.forEach(s => steps.push({ ...s, chapter_id: ch.id }))
      })
      setAllSteps(steps)

      const [stepData, slidesData] = await Promise.all([
        api.get(`/steps/${id}`),
        api.get(`/steps/${id}/slides`)
      ])

      setStep(stepData)
      setSlides(slidesData)
      setCurrentSlideIndex(0)
      setQuizAnswers({})
      setQuizSubmitted({})
      setQuizResults({})
      setTotalXpEarned(0)
      setShowCompleteScreen(false)
    } catch (e) {
      console.error('Error loading step:', e)
    } finally {
      setLoading(false)
    }
  }

  // Slide navigation helpers
  const currentSlide = slides[currentSlideIndex]
  // Progress: 0% at start, 100% only after completing last slide
  const progress = slides.length > 0 ? (currentSlideIndex / slides.length) * 100 : 0
  const isLastSlide = currentSlideIndex === slides.length - 1

  // Explanation popup state
  const [showExplanation, setShowExplanation] = useState(false)
  const [currentExplanation, setCurrentExplanation] = useState('')

  const goNext = useCallback(() => {
    if (currentSlideIndex < slides.length - 1) setCurrentSlideIndex(i => i + 1)
  }, [currentSlideIndex, slides.length])

  // Does the current slide have an unanswered quiz?
  const currentQuizBlocks = useMemo(() => {
    if (!currentSlide?.blocks) return []
    return currentSlide.blocks.filter(b => (b.type || b.block_type) === 'quiz')
  }, [currentSlide])

  const hasQuiz = currentQuizBlocks.length > 0
  const allQuizzesAnswered = currentQuizBlocks.every(b => quizSubmitted[b.id])
  const allQuizzesCorrect = currentQuizBlocks.every(b => quizResults[b.id]?.correct)

  // The footer button logic:
  // - If slide has quiz and not all submitted → "Check" (disabled until all selected)
  // - If slide has quiz and submitted but wrong → "Try Again"
  // - Otherwise → "Continue" (or "Complete" on last slide)
  const allQuizzesSelected = currentQuizBlocks.every(b => quizAnswers[b.id] != null)

  // Quiz handlers
  const handleQuizAnswer = (blockId, answer) => {
    setQuizAnswers(prev => ({ ...prev, [blockId]: answer }))
  }

  const handleQuizSubmit = (blockId, isCorrect, explanation) => {
    const xp = isCorrect ? 15 : 0
    setQuizSubmitted(prev => ({ ...prev, [blockId]: true }))
    setQuizResults(prev => ({ ...prev, [blockId]: { correct: isCorrect, xp, explanation } }))
    if (isCorrect) setTotalXpEarned(prev => prev + xp)
  }

  const handleQuizRetry = (blockId) => {
    setQuizSubmitted(prev => ({ ...prev, [blockId]: false }))
    setQuizAnswers(prev => ({ ...prev, [blockId]: null }))
    setQuizResults(prev => {
      const copy = { ...prev }
      delete copy[blockId]
      return copy
    })
  }

  // Completion
  const handleComplete = () => setShowCompleteScreen(true)

  const handleCompleteAndNavigate = async () => {
    try {
      await api.post(`/steps/${id}/complete`, { score: 100 })
      const currentIdx = allSteps.findIndex(s => s.id === parseInt(id))
      if (currentIdx < allSteps.length - 1) {
        const next = allSteps[currentIdx + 1]
        navigate(`/course/${slug}/step/${encodeStepId(next.id)}`)
      } else {
        navigate(`/course/${slug}`)
      }
    } catch {
      navigate(`/course/${slug}`)
    }
  }

  // ── LOADING ──
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
          <p className="text-stone-500 text-sm">Loading lesson…</p>
        </div>
      </div>
    )
  }

  // ── EMPTY ──
  if (!step || slides.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-500 mb-4">No content found for this lesson.</p>
          <Button asChild variant="outline">
            <Link to={`/course/${slug}`}>Back to Course</Link>
          </Button>
        </div>
      </div>
    )
  }

  // ── COMPLETION SCREEN ──
  if (showCompleteScreen) {
    return (
      <CompleteScreen
        xpEarned={totalXpEarned || (step?.xp_reward || 10)}
        stepTitle={step?.title}
        onContinue={handleCompleteAndNavigate}
      />
    )
  }

  // Footer button handler
  const handleFooterAction = () => {
    if (hasQuiz && !allQuizzesAnswered) {
      // Submit all quizzes on this slide
      currentQuizBlocks.forEach(b => {
        if (!quizSubmitted[b.id] && quizAnswers[b.id] != null) {
          const content = b.content || b.block_data || {}
          const isCorrect = String(quizAnswers[b.id]) === String(content.correct)
          handleQuizSubmit(b.id, isCorrect, content.explanation)
        }
      })
      return
    }
    // Continue / Complete (works for both correct and incorrect)
    if (isLastSlide) {
      handleComplete()
    } else {
      goNext()
    }
  }

  // Handle Why button click
  const handleWhyClick = () => {
    const explanations = currentQuizBlocks
      .map(b => (b.content || b.block_data || {}).explanation)
      .filter(Boolean)
    setCurrentExplanation(explanations.join('\n\n') || 'No explanation available.')
    setShowExplanation(true)
  }

  // Quiz state for footer styling
  const quizIsAnswered = hasQuiz && allQuizzesAnswered
  const quizIsCorrect = quizIsAnswered && allQuizzesCorrect
  const quizIsIncorrect = quizIsAnswered && !allQuizzesCorrect

  // Calculate XP for current slide
  const currentSlideXp = currentQuizBlocks.reduce((sum, b) => {
    return sum + (quizResults[b.id]?.xp || 0)
  }, 0)

  // ── MAIN RENDER ──
  return (
    <div className="h-[100dvh] flex flex-col bg-stone-100 overflow-hidden">
      {/* ── Header ── 1/10 of screen */}
      <header className="h-[10vh] shrink-0 flex items-center justify-center relative bg-white">
        {/* Exit button — top left */}
        <button
          onClick={() => navigate(`/course/${slug}`)}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          title="Exit lesson"
        >
          <XIcon className="w-5 h-5" />
        </button>

        {/* Progress bar — centered, ~50% width */}
        <div className="w-1/2 max-w-md">
          <div className="h-2.5 bg-stone-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
        </div>
      </header>

      {/* ── Body ── 8/10 of screen */}
      <main className="h-[80vh] shrink-0 overflow-y-auto">
        <div className="h-full flex items-center justify-center px-4 sm:px-8">
          <div className="w-full max-w-2xl -mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlideIndex}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="space-y-6"
              >
                {currentSlide?.blocks?.map((block, blockIdx) => (
                  <BlockRenderer
                    key={block.id || `${currentSlideIndex}-${blockIdx}`}
                    block={block}
                    quizAnswer={quizAnswers[block.id]}
                    quizSubmitted={quizSubmitted[block.id]}
                    quizResult={quizResults[block.id]}
                    onQuizAnswer={(ans) => handleQuizAnswer(block.id, ans)}
                    onQuizSubmit={(correct, explanation) => handleQuizSubmit(block.id, correct, explanation)}
                    onQuizRetry={() => handleQuizRetry(block.id)}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* ── Footer ── handles quiz feedback states */}
      <footer className={cn(
        'h-[10vh] shrink-0 flex items-center justify-center transition-colors duration-300',
        quizIsCorrect ? 'bg-emerald-500' :
        quizIsIncorrect ? 'bg-stone-400' :
        'bg-white'
      )}>
        {quizIsAnswered ? (
          // Answered state - show feedback
          <div className="flex items-center gap-6">
            {/* Feedback indicator */}
            <div className="flex items-center gap-2">
              {quizIsCorrect ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" strokeWidth={3} />
                  </div>
                  <div className="text-white">
                    <p className="font-bold text-sm">Correct!</p>
                    <p className="text-xs opacity-90">+{currentSlideXp} XP</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <XIcon className="w-5 h-5 text-white" strokeWidth={3} />
                  </div>
                  <p className="font-bold text-white text-sm">Incorrect</p>
                </>
              )}
            </div>

            {/* Why? button */}
            <Button
              onClick={handleWhyClick}
              variant="ghost"
              className={cn(
                'h-10 px-4 text-sm font-semibold rounded-xl',
                quizIsCorrect ? 'text-white hover:bg-white/20' : 'text-white hover:bg-white/20'
              )}
            >
              <HelpCircle className="w-4 h-4 mr-1.5" />
              Why?
            </Button>

            {/* Continue button */}
            <Button
              onClick={handleFooterAction}
              className={cn(
                'h-10 px-6 text-sm font-bold rounded-xl',
                quizIsCorrect 
                  ? 'bg-white text-emerald-600 hover:bg-white/90' 
                  : 'bg-white text-stone-600 hover:bg-white/90'
              )}
            >
              Continue
            </Button>
          </div>
        ) : (
          // Not answered yet - show Check or Continue
          <Button
            onClick={handleFooterAction}
            disabled={hasQuiz && !allQuizzesSelected}
            className={cn(
              'h-12 px-10 text-base font-bold rounded-2xl shadow-sm transition-all disabled:opacity-40',
              hasQuiz && !allQuizzesAnswered
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : isLastSlide
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            )}
          >
            {hasQuiz && !allQuizzesAnswered ? 'Check' : (isLastSlide ? 'Complete' : 'Continue')}
          </Button>
        )}
      </footer>

      {/* ── Explanation Modal with Blur ── */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setShowExplanation(false)}
          >
            {/* Blur backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            
            {/* Modal content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-amber-800">Explanation</h3>
                </div>
                <button
                  onClick={() => setShowExplanation(false)}
                  className="p-1 rounded-lg hover:bg-amber-100 text-amber-600 transition"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
              
              {/* Body */}
              <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
                <div className="text-stone-700 leading-relaxed">
                  <MathText text={currentExplanation} />
                </div>
              </div>
              
              {/* Footer */}
              <div className="px-6 py-4 bg-stone-50 border-t border-stone-100">
                <Button
                  onClick={() => setShowExplanation(false)}
                  className="w-full h-10 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold"
                >
                  Got it!
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// BLOCK RENDERER
// ═══════════════════════════════════════════════════════════════════════════════

function BlockRenderer({ block, quizAnswer, quizSubmitted, quizResult, onQuizAnswer, onQuizSubmit, onQuizRetry }) {
  const type = block.type || block.block_type

  switch (type) {
    case 'text':       return <TextBlock block={block} />
    case 'math':       return <MathBlock block={block} />
    case 'image':      return <ImageBlock block={block} />
    case 'quiz':       return (
      <QuizBlock
        block={block}
        answer={quizAnswer}
        submitted={quizSubmitted}
        result={quizResult}
        onAnswer={onQuizAnswer}
        onSubmit={onQuizSubmit}
        onRetry={onQuizRetry}
      />
    )
    case 'code':       return <CodeBlock block={block} />
    case 'callout':    return <CalloutBlock block={block} />
    case 'reveal':     return <RevealBlock block={block} />
    case 'video':      return <VideoBlock block={block} />
    case 'fill_blank': return <FillBlankBlock block={block} />
    case 'ordering':   return <OrderingBlock block={block} />
    case 'interactive_graph': return <InteractiveGraphBlock block={block} />
    default:
      return <div className="text-stone-400 text-sm italic">Unsupported block type: {type}</div>
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// TEXT BLOCK
// ═══════════════════════════════════════════════════════════════════════════════

function TextBlock({ block }) {
  const content = block.content || block.block_data || {}

  return (
    <div className="space-y-3">
      {content.heading && (
        <h2 className="text-xl sm:text-2xl font-bold text-stone-900 leading-tight">
          <MathText text={content.heading} />
        </h2>
      )}
      {content.paragraphs?.map((p, idx) => (
        <p key={idx} className="text-base text-stone-700 leading-[1.8]">
          <MathText text={formatText(p)} html />
        </p>
      ))}
      {content.content && (
        <div className="text-base text-stone-700 leading-[1.8]">
          <MathText text={formatText(content.content)} html />
        </div>
      )}
    </div>
  )
}

function formatText(text) {
  if (!text) return ''
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-stone-900">$1</strong>')
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
  text = text.replace(/_(.*?)_/g, '<em>$1</em>')
  return text
}


// ═══════════════════════════════════════════════════════════════════════════════
// MATH BLOCK
// ═══════════════════════════════════════════════════════════════════════════════

function MathBlock({ block }) {
  const content = block.content || block.block_data || {}
  const latex = content.latex || ''
  const label = content.label
  const isInline = content.display_mode === 'inline'

  try {
    return (
      <div className="my-4">
        {label && (
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">
            {label}
          </p>
        )}
        <div className={cn(
          'bg-stone-50/80 rounded-xl border border-stone-100 px-6 py-5',
          isInline && 'inline-block bg-transparent border-0 p-0'
        )}>
          {isInline ? (
            <InlineMath math={latex} />
          ) : (
            <div className="text-center overflow-x-auto">
              <BlockMath math={latex} />
            </div>
          )}
        </div>
      </div>
    )
  } catch {
    return (
      <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">
        Error rendering math: <code className="font-mono text-xs">{latex}</code>
      </div>
    )
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE BLOCK
// ═══════════════════════════════════════════════════════════════════════════════

function ImageBlock({ block }) {
  const content = block.content || block.block_data || {}
  const [loaded, setLoaded] = useState(false)

  return (
    <figure className="my-6">
      <div className="relative overflow-hidden rounded-xl bg-stone-100">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-500 rounded-full animate-spin" />
          </div>
        )}
        <img
          src={content.src}
          alt={content.alt || ''}
          onLoad={() => setLoaded(true)}
          className={cn(
            'w-full transition-opacity duration-300',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
        />
      </div>
      {content.caption && (
        <figcaption className="mt-2 text-center text-sm text-stone-400 italic">
          <MathText text={content.caption} />
        </figcaption>
      )}
    </figure>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// CODE BLOCK
// ═══════════════════════════════════════════════════════════════════════════════

function CodeBlock({ block }) {
  const content = block.content || block.block_data || {}
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content.code || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-stone-200 bg-[#1e1e2e]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#181825] border-b border-stone-700/30">
        <span className="text-xs font-mono text-stone-400">{content.language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="text-stone-400 hover:text-stone-200 transition p-1 rounded"
        >
          {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-green-300 font-mono">{content.code}</code>
      </pre>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ BLOCK — Interactive inline quiz
// ═══════════════════════════════════════════════════════════════════════════════

function QuizBlock({ block, answer, submitted, result, onAnswer, onSubmit, onRetry }) {
  const content = block.content || block.block_data || {}
  const question = content.question || ''
  const options = content.options || []
  const correctAnswer = content.correct

  const isCorrect = result?.correct

  return (
    <div className="space-y-6">
      {/* Question */}
      <p className="text-xl font-bold text-stone-900 leading-relaxed text-center">
        <MathText text={question} />
      </p>

      {/* Options - Horizontal layout with square boxes */}
      <div className="flex flex-wrap justify-center gap-3">
        {options.map((opt, idx) => {
          const optValue = opt.value ?? opt.id ?? idx
          const optLabel = opt.label || opt.text || (typeof opt === 'string' ? opt : String(opt))
          const isSelected = answer === optValue
          const showCorrectMark = submitted && String(optValue) === String(correctAnswer)
          const showWrongMark = submitted && isSelected && String(optValue) !== String(correctAnswer)

          return (
            <motion.button
              key={optValue}
              onClick={() => !submitted && onAnswer(optValue)}
              disabled={submitted}
              animate={showWrongMark ? { x: [0, -4, 4, -3, 3, 0] } : {}}
              transition={{ duration: 0.3 }}
              className={cn(
                'relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-3 transition-all duration-200 flex flex-col items-center justify-center p-2',
                showCorrectMark
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-lg shadow-emerald-100'
                  : showWrongMark
                    ? 'bg-red-50 border-red-400 text-red-700 shadow-lg shadow-red-100'
                    : isSelected
                      ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-lg shadow-blue-100'
                      : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-50 hover:shadow-md'
              )}
            >
              {/* Corner indicator */}
              {(showCorrectMark || showWrongMark) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    'absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center',
                    showCorrectMark ? 'bg-emerald-500' : 'bg-red-500'
                  )}
                >
                  {showCorrectMark ? (
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  ) : (
                    <XIcon className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  )}
                </motion.div>
              )}

              {/* Option label */}
              <span className={cn(
                'text-xs font-bold mb-1 transition-colors',
                showCorrectMark ? 'text-emerald-500' :
                showWrongMark   ? 'text-red-500' :
                isSelected      ? 'text-blue-500' :
                                  'text-stone-400'
              )}>
                {String.fromCharCode(65 + idx)}
              </span>

              {/* Option content */}
              <span className="text-sm sm:text-base font-semibold leading-tight text-center">
                <MathText text={typeof optLabel === 'string' ? optLabel : String(optLabel)} />
              </span>

              {/* Selection ring for non-submitted */}
              {isSelected && !submitted && (
                <motion.div
                  layoutId="selection-ring"
                  className="absolute inset-0 rounded-2xl border-3 border-blue-400"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// CALLOUT BLOCK — Theorem / Tip / Warning / Info
// ═══════════════════════════════════════════════════════════════════════════════

const calloutConfig = {
  info:    { icon: Info,           bg: 'bg-blue-50',    border: 'border-blue-200', iconColor: 'text-blue-500',    title: 'Info' },
  tip:     { icon: Lightbulb,     bg: 'bg-amber-50',   border: 'border-amber-200', iconColor: 'text-amber-500',  title: 'Tip' },
  warning: { icon: AlertTriangle, bg: 'bg-orange-50',  border: 'border-orange-200', iconColor: 'text-orange-500', title: 'Warning' },
  theorem: { icon: GraduationCap, bg: 'bg-violet-50',  border: 'border-violet-200', iconColor: 'text-violet-500', title: 'Theorem' },
  note:    { icon: Info,          bg: 'bg-stone-50',   border: 'border-stone-200', iconColor: 'text-stone-500',   title: 'Note' },
}

function CalloutBlock({ block }) {
  const content = block.content || block.block_data || {}
  const variant = content.variant || content.callout_type || 'info'
  const cfg = calloutConfig[variant] || calloutConfig.info
  const Icon = cfg.icon

  return (
    <div className={cn('my-6 rounded-xl border p-5', cfg.bg, cfg.border)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('w-5 h-5 mt-0.5 shrink-0', cfg.iconColor)} />
        <div className="space-y-1.5 min-w-0">
          <p className={cn('text-sm font-bold uppercase tracking-wider', cfg.iconColor)}>
            {content.title || cfg.title}
          </p>
          {content.body && (
            <div className="text-sm text-stone-700 leading-relaxed">
              <MathText text={content.body} />
            </div>
          )}
          {content.content && (
            <div className="text-sm text-stone-700 leading-relaxed">
              <MathText text={content.content} />
            </div>
          )}
          {content.latex && (
            <div className="mt-2 overflow-x-auto">
              <BlockMath math={content.latex} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// REVEAL BLOCK — Step-by-step solution
// ═══════════════════════════════════════════════════════════════════════════════

function RevealBlock({ block }) {
  const content = block.content || block.block_data || {}
  const steps = content.steps || content.items || []
  const [revealedCount, setRevealedCount] = useState(0)

  return (
    <div className="my-6 rounded-xl border border-stone-200 bg-white overflow-hidden">
      <div className="px-5 py-3 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-stone-700 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          {content.title || 'Step-by-step Solution'}
        </span>
        <span className="text-xs text-stone-400">{revealedCount} / {steps.length} steps</span>
      </div>
      <div className="p-5 space-y-3">
        {steps.map((s, idx) => {
          const isRevealed = idx < revealedCount
          const stepText = typeof s === 'string' ? s : (s.content || s.text || '')
          return (
            <motion.div
              key={idx}
              initial={false}
              animate={{ opacity: isRevealed ? 1 : 0.3 }}
              className="flex items-start gap-3"
            >
              <span className={cn(
                'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5',
                isRevealed ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-400'
              )}>
                {idx + 1}
              </span>
              <div className="text-sm text-stone-700 leading-relaxed min-w-0">
                {isRevealed ? <MathText text={stepText} /> : <span className="text-stone-300">• • •</span>}
              </div>
            </motion.div>
          )
        })}

        {revealedCount < steps.length ? (
          <Button
            onClick={() => setRevealedCount(prev => prev + 1)}
            variant="outline"
            className="w-full mt-2 rounded-xl text-sm"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" /> Reveal Next Step
          </Button>
        ) : (
          <Button
            onClick={() => setRevealedCount(0)}
            variant="ghost"
            className="w-full mt-2 rounded-xl text-sm text-stone-400"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
          </Button>
        )}
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO BLOCK
// ═══════════════════════════════════════════════════════════════════════════════

function VideoBlock({ block }) {
  const content = block.content || block.block_data || {}
  return (
    <div className="my-6">
      <div className="rounded-xl overflow-hidden bg-black aspect-video">
        <video
          src={content.src}
          controls
          className="w-full h-full"
          poster={content.poster}
        />
      </div>
      {content.caption && (
        <p className="mt-2 text-center text-sm text-stone-400 italic">{content.caption}</p>
      )}
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// FILL-IN-THE-BLANK BLOCK
// ═══════════════════════════════════════════════════════════════════════════════

function FillBlankBlock({ block }) {
  const content = block.content || block.block_data || {}
  const template = content.template || ''
  const blanks = content.blanks || []
  const [values, setValues] = useState({})
  const [checked, setChecked] = useState(false)
  const [results, setResults] = useState({})

  const parts = template.split(/(___\d+___)/g)

  const handleChange = (id, val) => {
    setValues(prev => ({ ...prev, [id]: val }))
    setChecked(false)
  }

  const handleCheck = () => {
    const res = {}
    blanks.forEach((b, idx) => {
      const blankId = b.id || idx
      const userVal = (values[blankId] || '').trim().toLowerCase()
      const correct = (Array.isArray(b.answer) ? b.answer : [b.answer]).map(a => String(a).trim().toLowerCase())
      res[blankId] = correct.includes(userVal)
    })
    setResults(res)
    setChecked(true)
  }

  return (
    <div className="my-6 rounded-xl border border-stone-200 p-5 bg-white">
      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Fill in the blanks</p>
      <div className="text-base text-stone-700 leading-[2] flex flex-wrap items-baseline gap-1">
        {parts.map((part, idx) => {
          const match = part.match(/___(\d+)___/)
          if (match) {
            const blankIdx = parseInt(match[1]) - 1
            const blank = blanks[blankIdx]
            const blankId = blank?.id ?? blankIdx
            const isCorrect = checked && results[blankId] === true
            const isWrong = checked && results[blankId] === false
            return (
              <input
                key={idx}
                type="text"
                value={values[blankId] || ''}
                onChange={(e) => handleChange(blankId, e.target.value)}
                placeholder={blank?.placeholder || '???'}
                className={cn(
                  'inline-block w-28 px-2 py-0.5 border-b-2 text-center text-sm font-medium bg-transparent outline-none transition',
                  isCorrect ? 'border-emerald-500 text-emerald-700' :
                  isWrong ? 'border-red-400 text-red-600' :
                  'border-stone-300 focus:border-blue-400 text-stone-800'
                )}
              />
            )
          }
          return <span key={idx}><MathText text={part} /></span>
        })}
      </div>
      <Button onClick={handleCheck} className="mt-4 rounded-xl" size="sm">
        Check
      </Button>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// ORDERING BLOCK — Drag to reorder
// ═══════════════════════════════════════════════════════════════════════════════

function OrderingBlock({ block }) {
  const content = block.content || block.block_data || {}
  const correctOrder = content.correct_order || content.items || []
  const [items, setItems] = useState(() =>
    [...correctOrder].sort(() => Math.random() - 0.5)
  )
  const [checked, setChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [dragIdx, setDragIdx] = useState(null)

  const moveItem = (from, to) => {
    setItems(prev => {
      const arr = [...prev]
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      return arr
    })
    setChecked(false)
  }

  const handleCheck = () => {
    const correct = items.every((item, idx) => {
      const expected = typeof correctOrder[idx] === 'string' ? correctOrder[idx] : correctOrder[idx]?.text
      const actual = typeof item === 'string' ? item : item?.text
      return actual === expected
    })
    setIsCorrect(correct)
    setChecked(true)
  }

  return (
    <div className="my-6 rounded-xl border border-stone-200 p-5 bg-white">
      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">
        {content.title || 'Put in the correct order'}
      </p>
      {content.question && (
        <p className="text-sm text-stone-600 mb-3"><MathText text={content.question} /></p>
      )}
      <div className="space-y-1.5">
        {items.map((item, idx) => {
          const label = typeof item === 'string' ? item : (item?.text || item?.label)
          return (
            <div
              key={idx}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragIdx !== null) moveItem(dragIdx, idx); setDragIdx(null) }}
              className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-lg border bg-white cursor-grab active:cursor-grabbing transition-colors',
                checked && isCorrect ? 'border-emerald-200 bg-emerald-50' :
                checked && !isCorrect ? 'border-red-200 bg-red-50' :
                'border-stone-200 hover:border-stone-300'
              )}
            >
              <GripVertical className="w-4 h-4 text-stone-300 shrink-0" />
              <span className="text-sm text-stone-700 font-medium">
                <MathText text={label} />
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <Button onClick={handleCheck} size="sm" className="rounded-xl">Check Order</Button>
        {checked && (
          <span className={cn('text-sm font-medium', isCorrect ? 'text-emerald-600' : 'text-red-500')}>
            {isCorrect ? 'Correct!' : 'Not quite — try rearranging'}
          </span>
        )}
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// INTERACTIVE GRAPH / EXPERIMENT
// ═══════════════════════════════════════════════════════════════════════════════

function InteractiveGraphBlock({ block }) {
  const content = block.content || block.block_data || {}
  const [param, setParam] = useState(content.default_value ?? 1)
  const min = content.min ?? -5
  const max = content.max ?? 5
  const step = content.step ?? 0.1

  return (
    <div className="my-6 rounded-xl border border-violet-200 bg-violet-50/40 p-5">
      <p className="text-xs font-semibold text-violet-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <Play className="w-3.5 h-3.5" /> Interactive Experiment
      </p>
      {content.title && (
        <p className="text-base font-medium text-stone-800 mb-2">{content.title}</p>
      )}
      {content.description && (
        <p className="text-sm text-stone-600 leading-relaxed mb-4">
          <MathText text={content.description} />
        </p>
      )}

      {/* Slider control */}
      {(content.param_name || content.slider) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-600 font-medium">{content.param_name || 'Value'}</span>
            <span className="font-mono text-violet-700 font-bold">{param}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={param}
            onChange={e => setParam(parseFloat(e.target.value))}
            className="w-full accent-violet-500"
          />
          <div className="flex justify-between text-xs text-stone-400">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </div>
      )}

      {content.latex && (
        <div className="mt-3 overflow-x-auto">
          <BlockMath math={content.latex.replace(/\{x\}/g, `{${param}}`)} />
        </div>
      )}

      {content.functions && (
        <div className="mt-3 p-3 bg-white/60 rounded-lg text-sm text-stone-500 font-mono space-y-1">
          {content.functions.map((fn, idx) => (
            <div key={idx}>f(x) = {fn.expression || fn}</div>
          ))}
        </div>
      )}
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPLETION SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

function CompleteScreen({ xpEarned, stepTitle, onContinue }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-8"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { color: 'bg-blue-100', size: 'w-16 h-16', radius: 'rounded-2xl', top: '25%', left: '25%', dur: 4 },
          { color: 'bg-emerald-100', size: 'w-12 h-12', radius: 'rounded-full', top: '33%', left: '75%', dur: 5 },
          { color: 'bg-amber-100', size: 'w-10 h-10', radius: 'rounded-xl', top: '66%', left: '33%', dur: 3.5 },
          { color: 'bg-violet-100', size: 'w-8 h-8', radius: 'rounded-lg', top: '50%', left: '66%', dur: 4.5 },
        ].map((d, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
            transition={{ duration: d.dur, repeat: Infinity, delay: i * 0.3 }}
            className={cn('absolute', d.color, d.size, d.radius)}
            style={{ top: d.top, left: d.left }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center space-y-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-200"
        >
          <Check className="w-12 h-12 text-white" strokeWidth={3} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-2">Lesson complete!</h1>
          <p className="text-stone-500 text-lg">Nice — let's keep the momentum going</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
          <p className="text-xs font-bold tracking-widest text-stone-400 uppercase mb-2">Total XP</p>
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ delay: 0.7, duration: 0.3 }}
            className="relative inline-block"
          >
            <span className="text-6xl sm:text-7xl font-bold text-stone-900">{xpEarned}</span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-500 ml-2">XP earned</span>
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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Button
            onClick={onContinue}
            className="h-14 px-12 text-lg font-bold bg-stone-900 hover:bg-stone-800 text-white rounded-2xl shadow-sm"
          >
            Continue
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// MATH TEXT HELPER — Renders inline $math$ within text
// ═══════════════════════════════════════════════════════════════════════════════

function MathText({ text, html = false }) {
  if (!text) return null
  const str = String(text)

  // Split on $...$ patterns
  const parts = str.split(/(\$[^$]+\$)/g)
  const hasMath = parts.some(p => p.startsWith('$') && p.endsWith('$'))

  if (!hasMath && html) {
    return <span dangerouslySetInnerHTML={{ __html: str }} />
  }

  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
          const latex = part.slice(1, -1)
          try {
            return <InlineMath key={idx} math={latex} />
          } catch {
            return <code key={idx} className="text-red-500 text-xs">{latex}</code>
          }
        }
        if (html) {
          return <span key={idx} dangerouslySetInnerHTML={{ __html: part }} />
        }
        return <span key={idx}>{part}</span>
      })}
    </>
  )
}
