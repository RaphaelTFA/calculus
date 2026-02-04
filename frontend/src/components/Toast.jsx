import { clsx } from 'clsx'
import { CheckCircle, AlertCircle, Info } from 'lucide-react'

export default function Toast({ message, type = 'info' }) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  }
  const Icon = icons[type] || Info

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-bounce-slight">
      <div className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg font-semibold',
        type === 'success' && 'bg-green-500 text-white',
        type === 'error' && 'bg-red-500 text-white',
        type === 'info' && 'bg-slate-800 text-white'
      )}>
        <Icon className="w-5 h-5" />
        <span>{message}</span>
      </div>
    </div>
  )
}
