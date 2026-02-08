import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const learningPaths = [
  {
    id: 1,
    slug: 'giai-tich-co-ban',
    title: 'Giải Tích Cơ Bản',
    description: 'Khám phá các khái niệm nền tảng của giải tích: giới hạn, đạo hàm, tích phân.',
    iconUrl: 'https://ds055uzetaobb.cloudfront.net/category-images/Foundations_of_Algebra-6MUKk8.png',
    courses: [
      { slug: 'gioi-han', title: 'Giới hạn', illustration: 'https://ds055uzetaobb.cloudfront.net/brioche/chapter/Arithmetic_Thinking-KaQBTB.png?width=204', isNew: false },
      { slug: 'dao-ham', title: 'Đạo hàm', illustration: 'https://ds055uzetaobb.cloudfront.net/brioche/chapter/Coordinate_Plane-TjmV5y.png?width=204', isNew: true },
      { slug: 'tich-phan', title: 'Tích phân', illustration: 'https://ds055uzetaobb.cloudfront.net/brioche/chapter/Visual_Algebra_1-wiJeeI.png?width=204', isNew: false },
    ],
  },
]

export default function Explore() {
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