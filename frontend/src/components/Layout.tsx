import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  CookingPot, Home, ShoppingBag, Package, ClipboardList, ShoppingCart,
  Menu, X,
} from 'lucide-react'
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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    inicializarSincronizacao()
  }, [])

  // Fechar drawer ao navegar
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  return (
    <ToastProvider>
    <div className="flex h-screen">
      {/* ─── Overlay do Drawer (mobile) ─── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ─── Sidebar (desktop) / Drawer (mobile) ─── */}
      <aside className={`
        fixed md:relative z-40 md:z-auto inset-y-0 left-0
        w-64 bg-massa-800 text-white flex flex-col shrink-0 shadow-[2px_0_12px_-6px_rgba(0,0,0,0.15)]
        transition-transform duration-300 ease-in-out
        ${drawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header da Sidebar */}
        <div className="p-5 border-b border-massa-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CookingPot className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-bold leading-tight" style={{ fontFamily: 'var(--font-serif)' }}>Mão na Massa</h1>
              <p className="text-xs text-massa-200">Gestão de produção</p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="md:hidden p-1 text-massa-200 hover:text-white"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  isActive
                    ? 'bg-massa-700 text-white'
                    : 'text-massa-200 hover:bg-massa-700/50 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
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

      {/* ─── Main Content ─── */}
      <main className="flex-1 overflow-auto relative pb-16 md:pb-0">
        {/* Botão hamburger no topo (mobile) */}
        <div className="md:hidden sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-1 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <CookingPot className="w-5 h-5 text-massa-500" />
            <span className="font-bold text-gray-800 text-sm" style={{ fontFamily: 'var(--font-serif)' }}>
              Mão na Massa
            </span>
          </div>
          <div className="ml-auto flex items-center">
            <NotificationBell />
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* ─── Bottom Navigation (mobile) ─── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t flex items-center justify-around safe-area-bottom shadow-[0_-2px_12px_-6px_rgba(0,0,0,0.12)]">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[56px] min-h-[48px] justify-center transition-colors ${
                isActive
                  ? 'text-massa-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-tight">{item.label}</span>
          </NavLink>
        ))}
      </nav>

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
