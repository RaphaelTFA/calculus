import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, PlayCircle, Clock, TrendingUp, BookOpen, Loader2 } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../lib/store'

export default function Explore() {
  const [stories, setStories] = useState([])
  const [continueStories, setContinueStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const { user } = useAuthStore()

  useEffect(() => {
    loadStories()
  }, [])

  const loadStories = async () => {
    try {
      setError(null)
      const data = await api.get('/stories')
      const allStories = Array.isArray(data) ? data : []
      setStories(allStories)
      
      // Filter stories that have progress (continue learning)
      const inProgress = allStories.filter(s => s.progress > 0 && s.progress < 100)
      setContinueStories(inProgress)
    } catch (e) {
      console.error('Failed to load stories:', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const filtered = stories.filter(s => 
    s.title?.toLowerCase().includes(search.toLowerCase())
  )

  // Use stories with progress for "Continue Learning", or show first 3 as featured
  const displayContinueCourses = continueStories.length > 0 
    ? continueStories 
    : stories.slice(0, 3).map(s => ({
        ...s,
        progress: 0,
        lastLesson: 'Bắt đầu học',
        estimatedTime: 'Mới'
      }))

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Khám phá khóa học</h1>
        <p className="text-slate-500 font-medium">Chọn một hành trình để bắt đầu</p>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="search"
          placeholder="Tìm kiếm khóa học..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all font-medium"
        />
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
          Không thể tải khóa học: {error}
          <button onClick={loadStories} className="ml-2 underline">Thử lại</button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Continue Learning / Featured Section */}
          {displayContinueCourses.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg shadow-orange-200">
                  <PlayCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {continueStories.length > 0 ? 'Tiếp tục học' : 'Khóa học nổi bật'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {continueStories.length > 0 ? 'Quay lại nơi bạn đã dừng' : 'Bắt đầu hành trình của bạn'}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayContinueCourses.map(course => (
                  <ContinueLearningCard key={course.id} course={course} />
                ))}
              </div>
            </section>
          )}

          {/* All Courses Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-200">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Tất cả khóa học</h2>
                <p className="text-sm text-slate-500">Khám phá toàn bộ nội dung</p>
              </div>
            </div>

            {/* Stories Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.length > 0 ? (
                filtered.map(story => (
                  <StoryCard key={story.id} story={story} />
                ))
              ) : (
                <div className="col-span-3 text-center py-12">
                  <p className="text-slate-400 font-medium text-lg">
                    {search ? 'Không tìm thấy khóa học nào' : 'Chưa có khóa học nào'}
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function ContinueLearningCard({ course }) {
  return (
    <Link 
      to={`/story/${course.slug}`}
      className="group bg-white rounded-2xl border-2 border-slate-100 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-100/50 transition-all duration-300 overflow-hidden"
    >
      {/* Progress bar at top */}
      <div className="h-1.5 bg-slate-100">
        <div 
          className={`h-full bg-gradient-to-r ${course.color || 'from-blue-500 to-indigo-600'} transition-all duration-500`}
          style={{ width: `${course.progress || 0}%` }}
        />
      </div>

      <div className="p-5">
        <div className="flex gap-4">
          {/* Icon */}
          <div className={`w-14 h-14 bg-gradient-to-br ${course.color || 'from-blue-500 to-indigo-600'} rounded-xl flex items-center justify-center text-2xl text-white shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
            {course.icon || '📘'}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors truncate">
              {course.title}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5 truncate">{course.lastLesson || course.description}</p>
            
            {/* Stats */}
            <div className="flex items-center gap-3 mt-2 text-xs">
              {course.progress > 0 && (
                <span className="flex items-center gap-1 text-slate-500">
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  <span className="font-semibold text-green-600">{course.progress}%</span>
                </span>
              )}
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                {course.estimatedTime || `${course.chapter_count || 0} chương`}
              </span>
            </div>
          </div>
        </div>

        {/* Continue button */}
        <button className="mt-4 w-full py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold rounded-xl shadow-md shadow-primary-200 hover:shadow-lg hover:shadow-primary-300 transition-all duration-300 flex items-center justify-center gap-2">
          <PlayCircle className="w-4 h-4" />
          {course.progress > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}
        </button>
      </div>
    </Link>
  )
}

function StoryCard({ story }) {
  return (
    <Link 
      to={`/story/${story.slug}`} 
      className="card-hover p-4 block h-full flex flex-col group"
    >
      <div className={`aspect-video bg-gradient-to-br ${story.color || 'from-blue-400 to-blue-600'} rounded-2xl mb-4 flex items-center justify-center text-5xl text-white shadow-inner relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10" />
        <span className="relative z-10 transform group-hover:scale-110 transition-transform duration-500">
          {story.icon || '📘'}
        </span>
      </div>
      
      <div className="flex-1 flex flex-col">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
          {story.category_name || 'Toán học'}
        </span>
        <h3 className="font-bold text-lg text-slate-700 group-hover:text-primary-600 transition-colors leading-tight">
          {story.title}
        </h3>
        <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">{story.description}</p>
        
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <span>{story.chapter_count || 0} CHƯƠNG</span>
          {story.progress > 0 && <span className="text-green-500">{story.progress}% XONG</span>}
        </div>
      </div>
    </Link>
  )
}
