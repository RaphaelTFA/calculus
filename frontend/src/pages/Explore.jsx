import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import categoriesData from '../../../data/categories.json';

// Load learningPaths directly from project `data/categories.json` (served as a static JSON).
function useLearningPaths() {
  const [learningPaths, setLearningPaths] = useState([])

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        // Try direct JSON file first (requested change). If not available, fall back to API.
        const data = categoriesData

        // support multiple possible formats: { learningPaths: [...] } | { categories: [...], learningPaths: [...] } | [...]
        const raw = data.learningPaths ?? data.learning_paths ?? (Array.isArray(data) ? data : data.categories) ?? []
        if(!raw) {
          console.warn('Warning: No learning paths found in the fetched data. Check the structure of categories.json or API response.')
        }
        const mapped = (raw || []).map(p => ({
          id: p.id ?? p.slug,
          slug: p.slug,
          title: p.title ?? p.name,
          description: p.description ?? p.summary ?? '',
          iconUrl: p.iconUrl ?? p.icon_url ?? p.icon ?? '',
          courses: p.courses ?? []
        }))

        if (mounted) setLearningPaths(mapped)
      } catch (err) {
        console.error('Error loading learning paths:', err)
        if (mounted) setLearningPaths([])
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  return learningPaths
}

export default function Explore() {
  const learningPaths = useLearningPaths()
  return (
     <div className="bg-white min-h-screen w-full pl-4 py-12 select-none" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
      
      {/* Title Section: Aligned left */}
      <div className="mb-16 max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Studying Modules
        </h1>

        <p className="mt-3 text-lg text-neutral-500 max-w-xl leading-relaxed">
          SbS modules designed to take you from fundamentals to mastery.
        </p>
      </div>

      <div className="space-y-16">
        {learningPaths.map((path, index) => (
          <>
            <PathSection key={path.id} path={path} />
            {index !== learningPaths.length - 1 && (
              <div className="w-full h-[1px] bg-gray-300" />
            )}
          </>
        ))}
      </div>
    </div>
  )
}

function PathSection({ path }) {
  return (
     <section className="bg-white w-full" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
      
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
      {/* 'rounded-3xl' ensures the left side is rounded while it spans to the right */}
      <div className="bg-[#F8F8F8] rounded-[24px] py-10 pl-10 flex items-center overflow-x-auto scrollbar-hide">
        {path.courses.map((course, index) => (
          <div key={course.slug} className="flex items-center">
            <CourseCard course={course} />
            {index !== path.courses.length - 1 && (
              <div className="w-8 h-[3px] bg-gray-300 shrink-0 -translate-y-4" />
            )}
          </div>
        ))}
      </div>
      {/* 3. SPACING - The 'mb-16' on the section ensures consistent spacing between sections */}
    </section>
  )
}

function CourseCard({ course }) {
  return (
     <Link to={`/course/${course.slug}`} className="flex-shrink-0 w-[176px] flex flex-col gap-6 no-underline group" style={{ fontFamily: 'Nunito, Arial, sans-serif' }}>
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