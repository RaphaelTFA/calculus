import { useState } from 'react'
import { 
  FolderOpen, 
  FileJson, 
  RefreshCw, 
  Download, 
  Upload, 
  Database,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export default function DataManager() {
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    
    try {
      const res = await fetch('/api/v1/admin/sync-data', { method: 'POST' })
      const data = await res.json()
      setSyncResult({ success: true, message: data.message || 'Sync completed!' })
    } catch (error) {
      setSyncResult({ success: false, message: error.message })
    } finally {
      setSyncing(false)
    }
  }

  const dataFiles = [
    { name: 'categories.json', path: 'data/categories.json', type: 'Categories' },
    { name: 'achievements.json', path: 'data/achievements.json', type: 'Achievements' },
    { name: 'gioi-han.json', path: 'data/courses/gioi-han.json', type: 'Course' },
    { name: 'dao-ham.json', path: 'data/courses/dao-ham.json', type: 'Course' },
    { name: 'tich-phan.json', path: 'data/courses/tich-phan.json', type: 'Course' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Data Manager</h2>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center justify-center gap-2 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing...' : 'Sync Data to Database'}
        </button>
        
        <button className="flex items-center justify-center gap-2 p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
          <Download size={20} />
          Export All Data
        </button>
        
        <button className="flex items-center justify-center gap-2 p-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
          <Upload size={20} />
          Import Data
        </button>
      </div>

      {/* Sync Result */}
      {syncResult && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          syncResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {syncResult.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {syncResult.message}
        </div>
      )}

      {/* Data Files */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <FolderOpen size={20} className="text-yellow-500" />
          <h3 className="font-semibold">Data Files (calculus/data/)</h3>
        </div>

        <div className="space-y-2">
          {dataFiles.map(file => (
            <div 
              key={file.path}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileJson size={20} className="text-blue-500" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">{file.path}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-gray-200 rounded text-sm">
                  {file.type}
                </span>
                <button className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded">
                  View
                </button>
                <button className="px-3 py-1 text-green-600 hover:bg-green-50 rounded">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Database Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database size={20} className="text-purple-500" />
          <h3 className="font-semibold">Database</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600">Type</p>
            <p className="text-lg font-semibold">SQLite</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600">Location</p>
            <p className="text-lg font-semibold">calculus.db</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600">Tables</p>
            <p className="text-lg font-semibold">10</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-600">Size</p>
            <p className="text-lg font-semibold">~100 KB</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200">
            Backup Database
          </button>
          <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
            Reset Database
          </button>
        </div>
      </div>
    </div>
  )
}
