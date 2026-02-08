import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Check, X } from 'lucide-react'
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

  useEffect(() => {
    loadData()
  }, [id, slug])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load story data for navigation context
      const fullStory = await api.get(`/stories/${slug}`)
      setStory(fullStory)

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

  const handleQuizSubmit = (blockId) => {
    setQuizSubmitted(prev => ({ ...prev, [blockId]: true }))
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
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-auto">
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

      {/* Navigation */}
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

  const isCorrect = submitted && answer === correctAnswer

  return (
    <Card className="bg-[#1a1a2e] border-white/10">
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
            const showCorrect = submitted && optValue === correctAnswer
            const showWrong = submitted && isSelected && optValue !== correctAnswer

            return (
              <button
                key={optValue}
                onClick={() => !submitted && onAnswer(optValue)}
                disabled={submitted}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  showCorrect
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : showWrong
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : isSelected
                        ? 'bg-blue-500/20 border-blue-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-sm ${
                    isSelected || showCorrect ? 'border-current' : 'border-white/30'
                  }`}>
                    {showCorrect ? <Check className="w-4 h-4" /> : 
                     showWrong ? <X className="w-4 h-4" /> : 
                     String.fromCharCode(65 + idx)}
                  </span>
                  {optLabel}
                </span>
              </button>
            )
          })}
        </div>

        {/* Submit button */}
        {!submitted && answer && (
          <Button 
            onClick={onSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Check Answer
          </Button>
        )}

        {/* Explanation */}
        {submitted && explanation && (
          <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
            <p className={`text-sm ${isCorrect ? 'text-green-400' : 'text-yellow-400'}`}>
              {isCorrect ? '✓ Correct! ' : '✗ Incorrect. '}
              {explanation}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
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

