import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import CourseEditor from './pages/CourseEditor'
import DataManager from './pages/DataManager'
import ServerStatus from './pages/ServerStatus'
import Settings from './pages/Settings'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:slug" element={<CourseEditor />} />
        <Route path="data" element={<DataManager />} />
        <Route path="server" element={<ServerStatus />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
