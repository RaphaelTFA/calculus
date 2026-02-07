import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Menu } from 'lucide-react'
import api from '../lib/api'
import './Step.css'

export default function Step() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [story, setStory] = useState(null)
  const [allSteps, setAllSteps] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeNodeId, setActiveNodeId] = useState(parseInt(id))
  const [selectedLessonId, setSelectedLessonId] = useState(null)
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [showCard, setShowCard] = useState(false)
  const selectedNodeRef = useRef(null)
  const levelHeaderRef = useRef(null)

  useEffect(() => {
    loadStoryData()
  }, [id])

  const loadStoryData = async () => {
    try {
      const storiesData = await api.get('/stories')
      
      if (Array.isArray(storiesData)) {
        let targetStory = storiesData.find(s => s.is_published) || storiesData[0]
        const fullStory = await api.get(`/stories/${targetStory.slug}`)
        setStory(fullStory)
        
        const steps = []
        fullStory.chapters?.forEach(ch => {
          ch.steps?.forEach(step => {
            steps.push({ ...step, chapter_id: ch.id })
          })
        })
        setAllSteps(steps)
        
        const stepExists = steps.some(s => s.id === parseInt(id))
        if (!stepExists && steps.length > 0) {
          navigate(`/step/${steps[0].id}`)
          return
        }
      }
    } catch (e) {
      console.error('Error loading story:', e)
    } finally {
      setLoading(false)
    }
  }

  // Handle scroll detection for card visibility
  useEffect(() => {
    if (!showCard) return // Only track scroll if card is visible
    
    const handleScroll = () => {
      if (!selectedNodeRef.current || !levelHeaderRef.current) {
        return
      }

      const nodeRect = selectedNodeRef.current.getBoundingClientRect()
      const headerRect = levelHeaderRef.current.getBoundingClientRect()
      
      // Case 1: Node's bottom passes the header's bottom (scrolling down)
      const nodeBottomPassesHeaderBottom = nodeRect.bottom <= headerRect.bottom
      
      // Case 2: Node's top passes the header's bottom (scrolling up - node moving down on screen)
      const nodeTopPassesHeaderDown = nodeRect.top >= headerRect.bottom
      
      // Hide card if either condition is true
      const shouldHide = nodeBottomPassesHeaderBottom || nodeTopPassesHeaderDown
      
      if (shouldHide) {
        // Only hide the card, keep the node selection
        setShowCard(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [selectedLesson, showCard])

  // Update selectedNodeRef whenever selectedLesson changes
  useEffect(() => {
    if (selectedLesson) {
      const nodeElement = document.querySelector(`[data-step-id="${selectedLesson.id}"]`)
      if (nodeElement) {
        selectedNodeRef.current = nodeElement
      }
    }
  }, [selectedLesson])


  const toggleNode = (stepId) => {
    setActiveNodeId(stepId)
    const step = allSteps.find(s => s.id === stepId)
    setSelectedLessonId(stepId)
    setSelectedLesson(step)
    setShowCard(true)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!story) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Story not found</p>
      </div>
    )
  }

  const currentStepIndex = allSteps.findIndex(s => s.id === parseInt(id))
  const currentStep = allSteps[currentStepIndex]

  return (
    <>
      {/* NAVIGATION BAR */}
      <nav className="step-navbar">
        <div className="navbar-content">
          <button 
            className="navbar-back-btn"
            onClick={() => navigate('/explore')}
            title="Back to Explore"
          >
            <ArrowLeft size={24} />
          </button>
          
          <div className="navbar-title">
            <h1 className="navbar-step-title">{currentStep?.title || 'Step'}</h1>
            <p className="navbar-story-title">{story?.title}</p>
          </div>
          
          <div className="navbar-progress">
            <span className="progress-text">{currentStepIndex + 1} / {allSteps.length}</span>
          </div>
        </div>
      </nav>

      <div className="page-wrapper">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-card">
            <img 
              src={story.thumbnail_url || 'https://ds055uzetaobb.cloudfront.net/brioche/chapter/Coordinate_Plane-TjmV5y.png'} 
              alt={story.title}
              className="sidebar-img"
            />
            <h2 className="sidebar-title">{story.title}</h2>
            <p className="sidebar-desc">{story.description}</p>
            <div className="sidebar-stats">
              <span>● {allSteps.length} Lessons</span>
              <span>▲ {allSteps.filter(s => s.is_completed).length} Completed</span>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-content">
          <section className="level-group">
            {/* STICKY LEVEL PILL */}
            <div className="sticky-header-container" id="level-header" ref={levelHeaderRef}>
              <div className="pill-wrapper">
                <div className="level-pill-shadow"></div>
                <button className="level-pill">
                  <span className="level-tag">Level {Math.floor(currentStepIndex / 3) + 1}</span>
                  <span className="level-name">{currentStep?.title || 'Select a step'}</span>
                </button>
              </div>
            </div>

            {/* WINDING PATH */}
            <div className="winding-path" id="winding-path">
              {allSteps.map((step, index) => {
                const isSelected = step.id === selectedLessonId
                const positions = ['left', 'center', 'right']
                const position = positions[index % 3]

                return (
                  <div key={step.id} data-step-id={step.id}>
                    <div 
                      className={`node-row pos-${position} ${isSelected ? 'is-active' : ''}`}
                      onClick={() => toggleNode(step.id)}
                    >
                      <div className="node-item">
                        <div className="icon-container">
                          <StepSVG isActive={isSelected} />
                        </div>
                        <div className="label-container">
                          <p className={isSelected ? 'label-active' : 'label-disabled'}>
                            {step.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </main>
      </div>
      
      {/* Fixed Lesson Card - stays on screen while scrolling */}
      {selectedLesson && showCard && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 max-w-md w-full px-4 z-40 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-4">
            {/* Title */}
            <h3 className="text-center text-xl font-bold text-black">
              {selectedLesson.title}
            </h3>
            
            {/* Description if available */}
            {selectedLesson.description && (
              <p className="text-center text-gray-600 text-sm">
                {selectedLesson.description}
              </p>
            )}
            
            {/* Start Button */}
            <button 
              onClick={() => navigate(`/step/${selectedLesson.id}`)}
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors mt-4"
            >
              Bắt đầu
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// =============================================================================
// SVG NODE COMPONENT
// =============================================================================

function StepSVG({ isActive }) {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="beamGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="#D1DAFF" />
        </radialGradient>
        <linearGradient id="beamVertical" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity="0.8" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <clipPath id="lipClip">
          <path d="M 56 136 Q 93 160 130 136 L 162 190 L 24 190 Z" />
        </clipPath>
      </defs>

      {/* Active state - Blue glow */}
      {isActive ? (
        <>
          <g className="active-ring-ui" style={{ opacity: 1 }}>
            <ellipse cx="93" cy="135" rx="73" ry="45" className="neon-blue-base" />
          </g>
          <g className="podium-group">
            <path d="M140.3 163.281C114.119 178.805 71.6697 178.805 45.4881 163.281C19.3065 147.757 19.3065 122.587 45.4881 107.063C71.6697 91.5383 114.119 91.5383 140.3 107.063C166.482 122.587 166.482 147.757 140.3 163.281Z" fill="#4D6EE8" />
            <path d="M140.3 163.281C114.119 178.805 71.6697 178.805 45.4881 163.281C19.3065 147.757 19.3065 122.587 45.4881 107.063C71.6697 91.5383 114.119 91.5383 140.3 107.063C166.482 122.587 166.482 147.757 140.3 163.281Z" fill="#6F8DFF" clipPath="url(#lipClip)" />
            <path d="M131.025 149.242C109.966 161.892 75.8224 161.891 54.7634 149.242C33.704 136.592 33.704 116.083 54.7634 103.434C75.8224 90.7845 109.966 90.7844 131.025 103.434C152.084 116.084 152.084 136.592 131.025 149.242Z" fill="#9fbafc" />
            <ellipse cx="92.89" cy="126.33" rx="48" ry="28" fill="url(#beamGlow)" />
            <path d="M 51,126 L 51,30 Q 93,10 135,30 L 135,126 Q 93,143 51,126" fill="url(#beamVertical)" />
            <ellipse cx="92.89" cy="126.33" rx="42" ry="25" fill="#FFFFFF" />
            <path d="M 75 85 L 80 78 L 75 71 L 70 78 Z" fill="white" opacity="0.6" />
          </g>
        </>
      ) : (
        /* Inactive state - Always gray */
        <g className="podium-group">
          <path d="M140.3 163.281C114.119 178.805 71.6697 178.805 45.4881 163.281C19.3065 147.757 19.3065 122.587 45.4881 107.063C71.6697 91.5383 114.119 91.5383 140.3 107.063C166.482 122.587 166.482 147.757 140.3 163.281Z" fill="#999797"/>
          <path d="M140.3 163.281C114.119 178.805 71.6697 178.805 45.4881 163.281C19.3065 147.757 19.3065 122.587 45.4881 107.063C71.6697 91.5383 114.119 91.5383 140.3 107.063C166.482 122.587 166.482 147.757 140.3 163.281Z" fill="#B0B0B0" clipPath="url(#lipClip)"/>
          <path d="M131.025 149.242C109.966 161.892 75.8224 161.891 54.7634 149.242C33.704 136.592 33.704 116.083 54.7634 103.434C75.8224 90.7845 109.966 90.7844 131.025 103.434C152.084 116.084 152.084 136.592 131.025 149.242Z" fill="#D9D9D9"/>
          <ellipse cx="92.89" cy="126.33" rx="30" ry="18" fill="#D9D9D9"/>
          <ellipse cx="92.89" cy="126.33" rx="42" ry="25" fill="none" stroke="#C2C2C2" strokeWidth="8" strokeDasharray="88 20" strokeDashoffset="44"/>
        </g>
      )}
    </svg>
  )
}

