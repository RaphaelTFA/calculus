import { useQuery } from '@tanstack/react-query'
import { BookOpen, Users, Award, TrendingUp } from 'lucide-react'

const API_URL = '/api/v1'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="text-white" size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/stories`)
      return res.json()
    }
  })

  const stats = [
    { icon: BookOpen, label: 'Total Courses', value: courses?.length || 0, color: 'bg-blue-500' },
    { icon: Users, label: 'Active Users', value: '—', color: 'bg-green-500' },
    { icon: Award, label: 'Achievements', value: 11, color: 'bg-yellow-500' },
    { icon: TrendingUp, label: 'Total XP Earned', value: '—', color: 'bg-purple-500' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-medium transition-colors">
            + New Course
          </button>
          <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-green-700 font-medium transition-colors">
            Sync Data
          </button>
          <button className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-yellow-700 font-medium transition-colors">
            Backup DB
          </button>
          <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 font-medium transition-colors">
            View Logs
          </button>
        </div>
      </div>

      {/* Recent Courses */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Courses</h3>
        <div className="space-y-3">
          {courses?.map(course => (
            <div 
              key={course.id} 
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{course.icon}</span>
                <div>
                  <p className="font-medium">{course.title}</p>
                  <p className="text-sm text-gray-500">{course.difficulty}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                course.is_published 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {course.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
