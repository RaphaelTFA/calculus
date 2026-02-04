import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  X, 
  Zap, 
  PartyPopper, 
  Sparkles,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Lightbulb
} from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../lib/store'

// shadcn/ui components
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'

export default function Step() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(null)
  const [slides, setSlides] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const [streakInfo, setStreakInfo] = useState(null)
  
  // Quiz state
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  
  const startTimeRef = useRef(Date.now())
  const { user, fetchUser } = useAuthStore()

  // Energy system (demo)
  const [energy, setEnergy] = useState(5)
  const maxEnergy = 5

  useEffect(() => {
    loadStep()
    startTimeRef.current = Date.now()
  }, [id])

  const loadStep = async () => {
    try {
      const [stepData, slidesData] = await Promise.all([
        api.get(`/steps/${id}`),
        api.get(`/steps/${id}/slides`)
      ])
      setStep(stepData)
      setSlides(slidesData || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const progress = slides.length > 0 ? ((currentIndex + 1) / slides.length) * 100 : 0
  const currentSlide = slides[currentIndex]
  const isLast = currentIndex === slides.length - 1

  // Find quiz block in current slide
  const quizBlock = currentSlide?.blocks?.find(b => b.type === 'quiz')

  const handleAnswerSelect = (value) => {
    if (isAnswered) return
    setSelectedAnswer(value)
  }

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !quizBlock) return
    
    const correct = selectedAnswer === quizBlock.content.correct
    setIsCorrect(correct)
    setIsAnswered(true)
    
    if (!correct) {
      setEnergy(prev => Math.max(0, prev - 1))
    }
  }

  const handleContinue = () => {
    if (isLast) {
      handleComplete()
    } else {
      // Reset quiz state for next slide
      setSelectedAnswer(null)
      setIsAnswered(false)
      setIsCorrect(false)
      setShowExplanation(false)
      setCurrentIndex(i => i + 1)
    }
  }

  const handleComplete = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    
    setCompleting(true)
    try {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const result = await api.post(`/steps/${id}/complete`, {
        score: 100,
        time_spent_seconds: timeSpent
      })
      
      setXpEarned(result.xp_earned || 15)
      setStreakInfo(result.streak || null)
      setShowComplete(true)
      
      if (fetchUser) {
        await fetchUser()
      }
      
      try {
        await api.post('/progress/check-achievements')
      } catch (e) {}
    } catch (e) {
      console.error(e)
      navigate(-1)
    } finally {
      setCompleting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // Success completion screen
  if (showComplete) {
    return <CompletionScreen 
      step={step} 
      xpEarned={xpEarned} 
      streakInfo={streakInfo} 
      onContinue={() => navigate(-1)} 
    />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header - Progress + Energy */}
      <header className="px-4 py-4 flex items-center gap-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-40">
        {/* Close button */}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)} 
          className="shrink-0"
        >
          <X className="w-5 h-5" />
        </Button>
        
        {/* Thin progress bar */}
        <div className="flex-1">
          <Progress value={progress} className="h-2" />
        </div>
        
        {/* Energy indicator */}
        <Badge variant="energy" className="flex items-center gap-1.5 px-3 py-1.5">
          <Zap className="w-4 h-4" />
          <span className="font-bold">{energy}</span>
        </Badge>
      </header>

      {/* Main Content - Single column, center-aligned */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 pb-32">
        <div className="w-full max-w-lg space-y-8">
          
          {/* Content blocks (non-quiz) */}
          {currentSlide?.blocks?.filter(b => b.type !== 'quiz').map(block => (
            <ContentBlock key={block.id} block={block} />
          ))}

          {/* Quiz/Problem Section */}
          {quizBlock && (
            <ProblemSection
              quiz={quizBlock}
              selectedAnswer={selectedAnswer}
              isAnswered={isAnswered}
              isCorrect={isCorrect}
              onSelectAnswer={handleAnswerSelect}
              onSubmit={handleSubmitAnswer}
            />
          )}

          {/* Non-quiz slide - just show continue */}
          {!quizBlock && (
            <div className="pt-8">
              <Button
                size="lg"
                onClick={handleContinue}
                disabled={completing}
                className="w-full h-16 text-lg font-bold"
              >
                {completing ? 'Saving...' : isLast ? 'Complete' : 'Continue'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Fixed Success/Feedback Bar */}
      {isAnswered && (
        <FeedbackBar
          isCorrect={isCorrect}
          xpReward={isCorrect ? 10 : 0}
          explanation={quizBlock?.content?.explanation}
          showExplanation={showExplanation}
          onToggleExplanation={() => setShowExplanation(!showExplanation)}
          onContinue={handleContinue}
          isLast={isLast}
          completing={completing}
        />
      )}
    </div>
  )
}

// =============================================================================
// CONTENT BLOCKS
// =============================================================================

function ContentBlock({ block }) {
  switch (block.type) {
    case 'text':
      return (
        <div className="space-y-4 text-center">
          {block.content.heading && (
            <h2 className="text-2xl font-bold text-foreground">{block.content.heading}</h2>
          )}
          {block.content.paragraphs?.map((p, i) => (
            <p key={i} className="text-muted-foreground text-lg leading-relaxed">{p}</p>
          ))}
        </div>
      )
    
    case 'math':
      return (
        <div className="text-center py-4">
          <code className="text-3xl md:text-4xl font-bold text-foreground font-mono">
            {block.content.latex}
          </code>
        </div>
      )
    
    case 'callout':
      return (
        <Card className={`${
          block.content.type === 'success' ? 'border-green-200 bg-green-50/50' :
          block.content.type === 'warning' ? 'border-yellow-200 bg-yellow-50/50' :
          'border-blue-200 bg-blue-50/50'
        }`}>
          <CardContent className="p-4 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              {block.content.title && (
                <p className="font-semibold text-foreground mb-1">{block.content.title}</p>
              )}
              <p className="text-muted-foreground">{block.content.text}</p>
            </div>
          </CardContent>
        </Card>
      )
    
    default:
      return null
  }
}

// =============================================================================
// PROBLEM SECTION - Visual puzzle + equation + choices
// =============================================================================

function ProblemSection({ quiz, selectedAnswer, isAnswered, isCorrect, onSelectAnswer, onSubmit }) {
  const options = quiz.content.options || []
  
  return (
    <div className="space-y-8">
      {/* Visual puzzle illustration placeholder */}
      <div className="aspect-video bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-primary-200">
        <div className="text-center space-y-2">
          <Sparkles className="w-12 h-12 text-primary-400 mx-auto" />
          <p className="text-primary-500 font-medium">Visual Illustration</p>
        </div>
      </div>

      {/* Equation/Question text - large, bold, centered */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
          {quiz.content.question}
        </h3>
        {quiz.content.hint && (
          <p className="text-muted-foreground">{quiz.content.hint}</p>
        )}
      </div>

      {/* Answer area - Card with dashed border */}
      <Card className="border-2 border-dashed bg-muted/30">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground text-center mb-4 font-medium">
            Select your answer
          </p>
          
          {/* Choices - 3-4 large buttons in a row */}
          {/* Fitts's Law: Large hit-area buttons */}
          <div className={`grid gap-3 ${
            options.length <= 2 ? 'grid-cols-2' : 
            options.length === 3 ? 'grid-cols-3' : 
            'grid-cols-2 md:grid-cols-4'
          }`}>
            {options.map((opt) => {
              const isSelected = selectedAnswer === opt.value
              const isCorrectAnswer = opt.value === quiz.content.correct
              
              let buttonStyle = 'border-2 border-border bg-card hover:border-primary hover:bg-primary-50'
              
              if (isAnswered) {
                if (isCorrectAnswer) {
                  buttonStyle = 'border-2 border-green-500 bg-green-50 text-green-700'
                } else if (isSelected && !isCorrect) {
                  buttonStyle = 'border-2 border-red-500 bg-red-50 text-red-700'
                } else {
                  buttonStyle = 'border-2 border-border bg-muted/50 opacity-50'
                }
              } else if (isSelected) {
                buttonStyle = 'border-2 border-primary bg-primary-50 ring-2 ring-primary ring-offset-2'
              }
              
              return (
                <button
                  key={opt.value}
                  onClick={() => onSelectAnswer(opt.value)}
                  disabled={isAnswered}
                  className={`
                    relative p-4 md:p-6 rounded-2xl font-bold text-lg md:text-xl
                    transition-all duration-200 min-h-[80px]
                    ${buttonStyle}
                    ${!isAnswered && 'active:scale-95'}
                  `}
                >
                  {opt.label}
                  
                  {/* Feedback icons */}
                  {isAnswered && isCorrectAnswer && (
                    <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-green-600" />
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <XCircle className="absolute top-2 right-2 w-5 h-5 text-red-600" />
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Submit button - only show if not answered yet */}
      {/* Primary CTA must be largest clickable element (Fitts's Law) */}
      {!isAnswered && (
        <Button
          size="lg"
          onClick={onSubmit}
          disabled={!selectedAnswer}
          className="w-full h-16 text-lg font-bold"
        >
          Check Answer
        </Button>
      )}
    </div>
  )
}

// =============================================================================
// FEEDBACK BAR - Bottom fixed success/error bar
// =============================================================================

function FeedbackBar({ isCorrect, xpReward, explanation, showExplanation, onToggleExplanation, onContinue, isLast, completing }) {
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
      isCorrect ? 'bg-green-500' : 'bg-red-500'
    }`}>
      {/* Explanation panel */}
      {showExplanation && explanation && (
        <div className="bg-white border-b px-6 py-4">
          <p className="text-foreground max-w-lg mx-auto">{explanation}</p>
        </div>
      )}
      
      <div className="px-6 py-4">
        <div className="max-w-lg mx-auto">
          {/* Success/Error message row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {isCorrect ? (
                <>
                  <PartyPopper className="w-8 h-8 text-white" />
                  <div>
                    <p className="font-bold text-white text-lg">Correct!</p>
                    {xpReward > 0 && (
                      <p className="text-white/80 text-sm font-medium">+{xpReward} XP</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 text-white" />
                  <div>
                    <p className="font-bold text-white text-lg">Not quite</p>
                    <p className="text-white/80 text-sm font-medium">Keep trying!</p>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* CTAs row */}
          <div className="flex items-center gap-3">
            {/* Secondary CTA: Why? (ghost) */}
            {explanation && (
              <Button
                variant="ghost"
                onClick={onToggleExplanation}
                className="text-white hover:bg-white/20 hover:text-white"
              >
                <HelpCircle className="w-4 h-4 mr-1.5" />
                Why?
              </Button>
            )}
            
            {/* Primary CTA: Continue - Largest button (Fitts's Law) */}
            <Button
              size="lg"
              onClick={onContinue}
              disabled={completing}
              className={`flex-1 h-14 text-base font-bold ${
                isCorrect 
                  ? 'bg-white text-green-600 hover:bg-white/90' 
                  : 'bg-white text-red-600 hover:bg-white/90'
              }`}
            >
              {completing ? 'Saving...' : isLast ? 'Complete' : 'Continue'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// COMPLETION SCREEN
// =============================================================================

function CompletionScreen({ step, xpEarned, streakInfo, onContinue }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-500 to-primary-700 flex items-center justify-center p-6">
      <div className="text-center text-white max-w-md w-full space-y-8">
        {/* Confetti celebration */}
        <div className="relative">
          <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mx-auto shadow-xl">
            <PartyPopper className="w-12 h-12 text-yellow-800" />
          </div>
          {/* Decorative sparkles */}
          <Sparkles className="absolute top-0 right-1/4 w-6 h-6 text-yellow-300 animate-pulse" />
          <Sparkles className="absolute bottom-0 left-1/4 w-4 h-4 text-white/60 animate-pulse delay-100" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Lesson Complete!</h1>
          <p className="text-white/70">{step?.title}</p>
        </div>

        {/* Stats cards */}
        <div className="flex justify-center gap-4">
          {xpEarned > 0 && (
            <Card className="bg-white/20 border-0 backdrop-blur">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-white">+{xpEarned}</p>
                <p className="text-sm text-white/70 font-medium">XP earned</p>
              </CardContent>
            </Card>
          )}
          
          {streakInfo && (
            <Card className={`border-0 backdrop-blur ${
              streakInfo.streak_increased 
                ? 'bg-orange-500/40 ring-2 ring-orange-300' 
                : 'bg-white/20'
            }`}>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-white">{streakInfo.current_streak}</p>
                <p className="text-sm text-white/70 font-medium">
                  {streakInfo.streak_increased ? 'Streak up!' : 'Day streak'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Motivational message */}
        {streakInfo?.streak_increased && streakInfo.current_streak > 1 && (
          <p className="text-white/80">
            🔥 Amazing! {streakInfo.current_streak} days in a row!
          </p>
        )}

        {/* Primary CTA - Continue */}
        <Button
          size="lg"
          onClick={onContinue}
          className="w-full h-14 bg-white text-primary-600 hover:bg-white/90 font-bold text-base"
        >
          Continue
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}
