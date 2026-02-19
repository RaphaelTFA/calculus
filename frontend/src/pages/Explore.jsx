import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

// Load learningPaths from backend (/api/v1/categories) which reads `data/categories.json`.
function useLearningPaths() {
  const [learningPaths, setLearningPaths] = useState([])

  useEffect(() => {
    let mounted = true
    fetch('/api/v1/categories')
      .then(res => res.json())
      .then(data => {
        // support multiple possible formats: { learningPaths: [...] } | { categories: [...], learningPaths: [...] } | [...]
        const raw = data.learningPaths ?? data.learning_paths ?? (Array.isArray(data) ? data : data.categories) ?? []
        const mapped = (raw || []).map(p => ({
          id: p.id ?? p.slug,
          slug: p.slug,
          title: p.title ?? p.name,
          description: p.description ?? p.summary ?? '',
          iconUrl: p.iconUrl ?? p.icon_url ?? p.icon ?? '',
          courses: p.courses ?? []
        }))
        if (mounted) setLearningPaths(mapped)
      })
      .catch(() => { if (mounted) setLearningPaths([]) })

    return () => { mounted = false }
  }, [])

  return learningPaths
}

export default function Explore() {
  const learningPaths = useLearningPaths()
  return (
    // Changed: Removed px-10, added pl-6. Added font-cofo.
    <div className="bg-white min-h-screen w-full pl-4 py-12 font-cofo select-none">
      
      {/* Title Section: Aligned left */}
      <div className="mb-[60px]">
        <h1 className="text-[24px] font-[700] tracking-tight mb-1 text-[#111]">
          Learning Paths
        </h1>
        <p className="text-[16px] text-[#666] font-[400]">
          Step-by-step paths to mastery
        </p>
      </div>

      <div className="space-y-16">
        {learningPaths.map((path) => (
          <PathSection key={path.id} path={path} />
        ))}
      </div>
    </div>
  )
}

function PathSection({ path }) {
  return (
    <section className="bg-white w-full">
      
      {/* 1. HEADER BLOCK - Shifted more to the right */}
      {/* Adjust 'pl-24' to move it more or less */}
      <div className="flex items-center gap-6 mb-6 pl-8"> 
        <div className="w-20 h-20 flex-shrink-0">
          <img src={path.iconUrl} alt={path.title} className="w-full h-full object-contain" />
        </div>
        <div className="flex items-baseline gap-8">
          <h2 className="text-[22px] font-[700] text-[#111]">{path.title}</h2>
          <p className="text-[16px] text-[#00000099] font-[400]">{path.description}</p>
        </div>
      </div>

      {/* 2. GRAY TRAY - Pinned further to the left */}
      {/* 'rounded-l-3xl' ensures the left side is rounded while it spans to the right */}
      <div className="bg-[#F8F8F8] rounded-l-[24px] py-10 pl-8 flex gap-6 overflow-x-auto scrollbar-hide">
        {path.courses.map((course) => (
          <CourseCard key={course.slug} course={course} />
        ))}
      </div>

    </section>
  )
}

function CourseCard({ course }) {
  return (
    <Link to={`/course/${course.slug}`} className="flex-shrink-0 w-[176px] flex flex-col gap-6 no-underline group">
      <motion.div
        whileHover={{ y: -2 }}
        className="relative w-[176px] h-[176px] bg-white border-2 border-[#E5E5E5] rounded-[24px] shadow-[0_4px_0_0_#E5E5E5] group-hover:shadow-[0_6px_0_0_#E5E5E5] flex items-center justify-center transition-all duration-200"
      >
        {course.isNew && (
          <div className="absolute top-2.5 right-2.5 bg-[#15B441] text-white text-[10px] font-[700] px-2 py-0.5 rounded-[10px] uppercase tracking-wider z-10">
            NEW
          </div>
        )}
        
        <img 
          src={course.illustration} 
          className="w-[102px] h-[102px] object-contain"
          alt={course.title}
        />
      </motion.div>
      
      <div className="text-[16px] text-center font-[500] text-[#111] leading-tight px-1">
        {course.title}
      </div>
    </Link>
  )
}