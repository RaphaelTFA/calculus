import { useQuery } from '@tanstack/react-query'
import { 
  Server, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Activity,
  Clock,
  Database
} from 'lucide-react'
import { useState } from 'react'

export default function ServerStatus() {
  const [refreshing, setRefreshing] = useState(false)

  const { data: backendStatus, refetch: refetchBackend } = useQuery({
    queryKey: ['backend-status'],
    queryFn: async () => {
      try {
        const start = Date.now()
        const res = await fetch('/api/v1/stories')
        const latency = Date.now() - start
        return { online: res.ok, latency }
      } catch {
        return { online: false, latency: 0 }
      }
    },
    refetchInterval: 30000
  })

  const { data: frontendStatus, refetch: refetchFrontend } = useQuery({
    queryKey: ['frontend-status'],
    queryFn: async () => {
      try {
        const start = Date.now()
        const res = await fetch('http://localhost:3000', { mode: 'no-cors' })
        const latency = Date.now() - start
        return { online: true, latency }
      } catch {
        return { online: false, latency: 0 }
      }
    },
    refetchInterval: 30000
  })

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchBackend(), refetchFrontend()])
    setRefreshing(false)
  }

  const services = [
    {
      name: 'Backend API',
      url: 'http://localhost:8000',
      status: backendStatus?.online,
      latency: backendStatus?.latency,
      icon: Server,
      description: 'FastAPI Backend Server'
    },
    {
      name: 'Frontend',
      url: 'http://localhost:3000',
      status: frontendStatus?.online,
      latency: frontendStatus?.latency,
      icon: Activity,
      description: 'React Frontend App'
    },
    {
      name: 'Admin Panel',
      url: 'http://localhost:3002',
      status: true,
      latency: 0,
      icon: Server,
      description: 'This admin panel'
    },
    {
      name: 'Database',
      url: 'calculus.db',
      status: backendStatus?.online,
      latency: null,
      icon: Database,
      description: 'SQLite Database'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Server Status</h2>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map(service => (
          <div key={service.name} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${
                  service.status ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <service.icon size={24} className={
                    service.status ? 'text-green-600' : 'text-red-600'
                  } />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{service.name}</h3>
                  <p className="text-sm text-gray-500">{service.description}</p>
                </div>
              </div>
              {service.status ? (
                <CheckCircle className="text-green-500" size={24} />
              ) : (
                <XCircle className="text-red-500" size={24} />
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
              <span className="text-gray-500">{service.url}</span>
              {service.latency !== null && (
                <span className="flex items-center gap-1 text-gray-500">
                  <Clock size={14} />
                  {service.latency}ms
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Commands */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold mb-4">Quick Commands</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">Start Backend</p>
            <code className="text-xs bg-gray-200 px-2 py-1 rounded">
              uvicorn app.main:app --reload
            </code>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">Start Frontend</p>
            <code className="text-xs bg-gray-200 px-2 py-1 rounded">
              npm run dev
            </code>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">Start Admin</p>
            <code className="text-xs bg-gray-200 px-2 py-1 rounded">
              npm run dev
            </code>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">Reset DB</p>
            <code className="text-xs bg-gray-200 px-2 py-1 rounded">
              python db_manager.py reset-seed
            </code>
          </div>
        </div>
      </div>

      {/* Ports Overview */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold mb-4">Ports Overview</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 text-sm text-gray-500">Service</th>
              <th className="text-left py-2 text-sm text-gray-500">Port</th>
              <th className="text-left py-2 text-sm text-gray-500">URL</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-3">Backend API</td>
              <td className="py-3 font-mono">8000</td>
              <td className="py-3">
                <a href="http://localhost:8000/docs" target="_blank" className="text-blue-600 hover:underline">
                  http://localhost:8000
                </a>
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-3">Frontend App</td>
              <td className="py-3 font-mono">3000</td>
              <td className="py-3">
                <a href="http://localhost:3000" target="_blank" className="text-blue-600 hover:underline">
                  http://localhost:3000
                </a>
              </td>
            </tr>
            <tr>
              <td className="py-3">Admin Panel</td>
              <td className="py-3 font-mono">3002</td>
              <td className="py-3">
                <a href="http://localhost:3002" target="_blank" className="text-blue-600 hover:underline">
                  http://localhost:3002
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
