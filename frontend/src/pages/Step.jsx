import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { X, ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import api from '../lib/api'

export default function Step() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(null)
  const [slides, setSlides] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStep()
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

  const goNext = () => {
    if (isLast) {
      // Complete lesson
      navigate(-1)
    } else {
      setCurrentIndex(i => i + 1)
    }
  }

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-bold">Đang tải bài học...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 flex items-center gap-4 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-sm z-40">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex-1">
          <div className="h-5 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
          <span className="font-bold text-slate-600">UNL</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6 pb-32">
        {currentSlide && (
          <div className="max-w-2xl mx-auto space-y-6">
            {currentSlide.blocks?.map(block => (
              <Block key={block.id} block={block} />
            ))}
          </div>
        )}
      </main>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-50">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <button 
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="w-12 h-12 rounded-xl border-b-4 border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:border-slate-300 transition-all active:border-b-0 active:translate-y-1 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button 
            onClick={goNext}
            className="flex-1 bg-green-500 hover:bg-green-400 text-white font-extrabold text-lg py-3 px-6 rounded-2xl border-b-4 border-green-700 shadow-lg active:border-b-0 active:translate-y-1 active:shadow-none transition-all uppercase tracking-wide"
          >
            {isLast ? 'HOÀN THÀNH' : 'TIẾP TỤC'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Block({ block }) {
  switch (block.type) {
    case 'text':
      return (
        <div className="space-y-4">
          {block.content.heading && (
            <h2 className="text-2xl font-extrabold text-slate-800">{block.content.heading}</h2>
          )}
          {block.content.paragraphs?.map((p, i) => (
            <p key={i} className="text-slate-600 text-lg leading-relaxed">{p}</p>
          ))}
        </div>
      )
    
    case 'math':
      return (
        <div className="bg-slate-50 rounded-2xl p-6 text-center">
          <code className="text-xl font-mono text-slate-800">{block.content.latex}</code>
        </div>
      )
    
    case 'quiz':
      return <QuizBlock block={block} />
    
    case 'callout':
      return (
        <div className={`rounded-2xl p-6 ${
          block.content.type === 'success' ? 'bg-green-50 border-2 border-green-200' :
          block.content.type === 'warning' ? 'bg-yellow-50 border-2 border-yellow-200' :
          'bg-blue-50 border-2 border-blue-200'
        }`}>
          {block.content.title && (
            <h4 className="font-bold text-lg mb-2">{block.content.title}</h4>
          )}
          <p className="text-slate-700">{block.content.text}</p>
        </div>
      )
    
    default:
      return null
  }
}

function QuizBlock({ block }) {
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  
  const handleSelect = (value) => {
    if (answered) return
    setSelected(value)
    setAnswered(true)
  }

  const isCorrect = selected === block.content.correct

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-slate-800">{block.content.question}</h3>
      <div className="space-y-3">
        {block.content.options?.map(opt => {
          const isSelected = selected === opt.value
          const showCorrect = answered && opt.value === block.content.correct
          
          return (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              disabled={answered}
              className={`w-full p-4 rounded-2xl border-2 text-left font-semibold transition-all ${
                showCorrect ? 'border-green-500 bg-green-50 text-green-700' :
                isSelected && !isCorrect ? 'border-red-500 bg-red-50 text-red-700' :
                'border-slate-200 hover:border-primary-500 hover:bg-primary-50'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className={`p-4 rounded-2xl font-semibold ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {isCorrect ? '✓ Chính xác!' : '✗ Sai rồi, hãy thử lại!'}
        </div>
      )}
    </div>
  )
}
