import { Save } from 'lucide-react'

export default function Settings() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Settings</h2>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold mb-4">General Settings</h3>
        
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site Name
            </label>
            <input
              type="text"
              defaultValue="Calculus App"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Backend URL
            </label>
            <input
              type="text"
              defaultValue="http://localhost:8000"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Folder Path
            </label>
            <input
              type="text"
              defaultValue="../data"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold mb-4">Database Settings</h3>
        
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Database Path
            </label>
            <input
              type="text"
              defaultValue="calculus.db"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoSeed"
              defaultChecked
              className="w-4 h-4"
            />
            <label htmlFor="autoSeed" className="text-sm">
              Auto-seed database on startup if empty
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sqlLogs"
              className="w-4 h-4"
            />
            <label htmlFor="sqlLogs" className="text-sm">
              Enable SQL query logging
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold mb-4">API Settings</h3>
        
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              JWT Secret Key
            </label>
            <input
              type="password"
              defaultValue="your-secret-key"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token Expiry (minutes)
            </label>
            <input
              type="number"
              defaultValue={30}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        <Save size={20} />
        Save Settings
      </button>
    </div>
  )
}
