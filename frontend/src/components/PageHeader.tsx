import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  backTo?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, icon, backTo, action }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            className="shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-massa-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        {icon && (
          <div className="shrink-0 text-massa-500">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-primary truncate">{title}</h1>
          {subtitle && <p className="text-sm text-muted truncate">{subtitle}</p>}
        </div>
      </div>
      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}
