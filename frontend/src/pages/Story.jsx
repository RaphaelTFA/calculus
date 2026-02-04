import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Lock, Star, Play, Trophy } from 'lucide-react'
import api from '../lib/api'

export default function Story() {
  const { slug } = useParams()
  const [story, setStory] = useState(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30" />
        <div className="max-w-md mx-auto px-4 py-12 space-y-8">
          <div className="skeleton h-20 w-20 rounded-full mx-auto" />
          <div className="skeleton h-32 rounded-3xl" />
          <div className="skeleton h-32 rounded-3xl" />
        </div>
      </div>
    )
  }

  if (!story) {
    return <div className="text-center py-20 text-slate-500">Không tìm thấy khóa học</div>
  }

  return (
    <div className="min-h-screen pb-20 -mx-4 -mt-6">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/explore" className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-500" />
          </Link>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-800 truncate">{story.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${story.progress || 0}%` }}
                />
              </div>
              <span className="text-xs font-bold text-primary-600">{story.progress || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="max-w-md mx-auto px-4 py-12 relative select-none">
        {/* Path Line */}
        <div className="absolute left-1/2 top-10 bottom-10 w-3 bg-slate-200 -ml-1.5 rounded-full z-0" />

        <div className="space-y-16 relative z-10">
          {/* Start Node */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-b from-primary-400 to-primary-600 shadow-game flex items-center justify-center text-3xl text-white mb-2 z-20 border-4 border-white">
              🏁
            </div>
            <span className="font-bold text-primary-600 uppercase tracking-widest text-sm bg-white px-3 py-1 rounded-full shadow-sm border border-primary-100">
              Bắt đầu
            </span>
          </div>

          {/* Chapters */}
          {story.chapters?.map((chapter, cIndex) => (
            <ChapterSegment key={chapter.id} chapter={chapter} index={cIndex} />
          ))}

          {/* End Node */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-4xl text-slate-400 border-4 border-white z-20 shadow-inner">
              <Trophy className="w-10 h-10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChapterSegment({ chapter, index }) {
  return (
    <div className="chapter-segment relative">
      {/* Chapter Marker */}
      <div className="sticky top-20 z-10 mb-12 pointer-events-none drop-shadow-md">
        <div className="bg-white/95 backdrop-blur shadow-sm border-2 border-slate-100 rounded-3xl p-4 mx-auto max-w-[220px] text-center">
          <h3 className="font-extrabold text-primary-600 text-xs uppercase tracking-widest mb-1">
            CHƯƠNG {index + 1}
          </h3>
          <p className="text-slate-800 text-sm font-bold leading-tight line-clamp-2">
            {chapter.title}
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="steps-container space-y-8">
        {chapter.steps?.map((step, sIndex) => (
          <StepNode key={step.id} step={step} index={sIndex} chapterIndex={index} />
        ))}
      </div>
    </div>
  )
}

function StepNode({ step, index, chapterIndex }) {
  const isCompleted = step.is_completed
  const isLocked = !isCompleted && !step.is_current && !(chapterIndex === 0 && index === 0)
  
  const offsets = ['translate-x-0', '-translate-x-12', 'translate-x-12', 'translate-x-0']
  const positionClass = offsets[index % 4]

  let content, className
  
  if (isCompleted) {
    content = <Star className="w-8 h-8" fill="currentColor" />
    className = 'bg-yellow-400 text-slate-800 border-b-4 border-yellow-600 shadow-lg'
  } else if (!isLocked) {
    content = <Play className="w-8 h-8" fill="currentColor" />
    className = 'bg-primary-500 text-white border-b-4 border-primary-700 shadow-[0_0_25px_rgba(139,92,246,0.6)] animate-bounce-slight'
  } else {
    content = <Lock className="w-6 h-6" />
    className = 'bg-slate-200 text-slate-400 border-b-4 border-slate-300 cursor-not-allowed opacity-80'
  }

  const Wrapper = isLocked ? 'div' : Link
  const wrapperProps = isLocked ? {} : { to: `/step/${step.id}` }

  return (
    <div className={`flex justify-center transform ${positionClass} transition-transform duration-500`}>
      <Wrapper 
        {...wrapperProps}
        className={`relative group w-20 h-20 rounded-[2rem] ${className} flex items-center justify-center transition-all z-20 ${!isLocked ? 'hover:scale-110 btn-game' : ''}`}
      >
        {content}
        
        {/* Tooltip */}
        <div className="absolute w-max max-w-[150px] -bottom-10 opacity-0 group-hover:opacity-100 transition-all bg-slate-800/90 backdrop-blur text-white text-[10px] font-bold py-1.5 px-3 rounded-xl z-30 pointer-events-none text-center transform group-hover:translate-y-1 shadow-xl left-1/2 -translate-x-1/2">
          {step.title}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800/90" />
        </div>
      </Wrapper>
    </div>
  )
}
