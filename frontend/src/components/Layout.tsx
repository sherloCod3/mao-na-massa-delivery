import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { CookingPot, Home, ShoppingBag, Package, ClipboardList, ShoppingCart } from 'lucide-react'
import OnlineStatus from './OnlineStatus'
import PwaInstallPrompt from './PwaInstallPrompt'
import SyncStatus from './SyncStatus'
import NotificationBell from './NotificationBell'
import { ToastProvider } from './Toast'
import { inicializarSincronizacao } from '../services/mutationQueue'

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/pedidos', icon: ShoppingBag, label: 'Pedidos' },
  { to: '/lista-compras', icon: ShoppingCart, label: 'Lista de Compras' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
  { to: '/ingredientes', icon: ClipboardList, label: 'Ingredientes' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    inicializarSincronizacao()
  }, [])

  return (
    <ToastProvider>
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-massa-800 text-white flex flex-col shrink-0 shadow-[2px_0_12px_-6px_rgba(0,0,0,0.15)]">
        <div className="p-5 border-b border-massa-700">
          <div className="flex items-center gap-3">
            <CookingPot className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-bold leading-tight" style={{ fontFamily: 'var(--font-serif)' }}>Mão na Massa</h1>
              <p className="text-xs text-massa-200">Gestão de produção</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-massa-700 text-white'
                    : 'text-massa-200 hover:bg-massa-700/50 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
          <div className="pt-2 px-1">
            <NotificationBell />
          </div>
        </nav>
        <div className="p-4 border-t border-massa-700 text-xs text-massa-400">
          Mão na Massa v0.1
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto relative">
        <div className="p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* PWA Install Banner */}
      <PwaInstallPrompt />

      {/* Offline indicator */}
      <OnlineStatus />

      {/* Sync pending indicator */}
      <SyncStatus />
    </div>
    </ToastProvider>
  )
}
