import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Plus, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'

const API_URL = '/api/v1'

export default function CourseEditor() {
  const { slug } = useParams()
  const [expandedChapters, setExpandedChapters] = useState({})
  
  const { data: course, isLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/stories/${slug}`)
      return res.json()
    }
  })

  const toggleChapter = (chapterId) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }))
  }

  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>
  }

  if (!course) {
    return <div className="text-center py-10">Course not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-4xl">{course.icon}</span>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{course.title}</h2>
            <p className="text-gray-500">{course.slug}</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Save size={20} />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Course Info */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4">Course Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  defaultValue={course.title}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  defaultValue={course.description}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select 
                  defaultValue={course.difficulty}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  defaultChecked={course.is_published}
                  className="w-4 h-4"
                />
                <label htmlFor="published" className="text-sm">Published</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  defaultChecked={course.is_featured}
                  className="w-4 h-4"
                />
                <label htmlFor="featured" className="text-sm">Featured</label>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Chapters & Steps */}
        <div className="col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Chapters & Steps</h3>
              <button className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                <Plus size={16} />
                Add Chapter
              </button>
            </div>

            <div className="space-y-3">
              {course.chapters?.map((chapter, chIdx) => (
                <div key={chapter.id} className="border rounded-lg">
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleChapter(chapter.id)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedChapters[chapter.id] ? (
                        <ChevronDown size={20} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={20} className="text-gray-400" />
                      )}
                      <span className="font-medium">Ch {chIdx + 1}: {chapter.title}</span>
                      <span className="text-sm text-gray-500">
                        ({chapter.steps?.length || 0} steps)
                      </span>
                    </div>
                    <button 
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {expandedChapters[chapter.id] && (
                    <div className="border-t bg-gray-50 p-4">
                      <div className="space-y-2">
                        {chapter.steps?.map((step, stIdx) => (
                          <div 
                            key={step.id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                                {stIdx + 1}
                              </span>
                              <span>{step.title}</span>
                              <span className="text-sm text-gray-400">+{step.xp_reward} XP</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="text-blue-600 text-sm hover:underline">
                                Edit
                              </button>
                              <button className="text-red-500 text-sm hover:underline">
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                        <button className="w-full p-2 border-2 border-dashed rounded-lg text-gray-400 hover:text-gray-600 hover:border-gray-400">
                          + Add Step
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
