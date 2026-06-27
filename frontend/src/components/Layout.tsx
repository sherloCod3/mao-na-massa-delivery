import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  CookingPot, Home, ShoppingBag, Package, ClipboardList, ShoppingCart,
  Settings, MessageCircle, LogOut,
  Menu, X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import OnlineStatus from './OnlineStatus'
import PwaInstallPrompt from './PwaInstallPrompt'
import SyncStatus from './SyncStatus'
import NotificationBell from './NotificationBell'
import { ToastProvider } from './Toast'
import { ThemeToggle } from './ThemeToggle'
import { inicializarSincronizacao } from '../services/mutationQueue'

const navItems = [
  { to: '/admin', icon: Home, label: 'Dashboard' },
  { to: '/admin/pedidos', icon: ShoppingBag, label: 'Pedidos' },
  { to: '/admin/produtos', icon: Package, label: 'Produtos' },
  { to: '/admin/ingredientes', icon: ClipboardList, label: 'Ingredientes' },
  { to: '/admin/lista-compras', icon: ShoppingCart, label: 'Lista de Compras' },
]

const navItemsSecondary = [
  { to: '/admin/configuracao', icon: Settings, label: 'Configuração' },
  { to: '/admin/depoimentos', icon: MessageCircle, label: 'Depoimentos' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()
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
        w-64 bg-massa-800 dark:bg-massa-50 text-white dark:text-massa-300 flex flex-col shrink-0
        shadow-[2px_0_12px_-6px_rgba(0,0,0,0.15)]
        transition-transform duration-300 ease-in-out
        ${drawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header da Sidebar */}
        <div className="p-5 border-b border-massa-700 dark:border-massa-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CookingPot className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-bold leading-tight text-white dark:text-massa-800" style={{ fontFamily: 'var(--font-serif)' }}>Mão na Massa</h1>
              <p className="text-xs text-massa-200 dark:text-massa-500">Gestão de produção</p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="md:hidden p-1 text-massa-200 dark:text-massa-500 hover:text-white"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  isActive
                    ? 'bg-massa-700 dark:bg-massa-200/30 text-white dark:text-white'
                    : 'text-massa-200 dark:text-massa-400 hover:bg-massa-700/50 dark:hover:bg-massa-200/20 hover:text-white dark:hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}

          {/* Separador */}
          <div className="pt-4 pb-1 px-4">
            <div className="h-px bg-massa-700/50 dark:bg-massa-200/20" />
          </div>

          {navItemsSecondary.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  isActive
                    ? 'bg-massa-700 dark:bg-massa-200/30 text-white dark:text-white'
                    : 'text-massa-200 dark:text-massa-400 hover:bg-massa-700/50 dark:hover:bg-massa-200/20 hover:text-white dark:hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}

          <div className="pt-2 px-1 flex items-center justify-between">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </nav>

        <div className="p-4 border-t border-massa-700 dark:border-massa-200 space-y-2">
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-massa-300 dark:text-massa-500 hover:bg-massa-700/50 dark:hover:bg-massa-200/20 hover:text-red-400 dark:hover:text-red-400 transition-colors min-h-[44px]"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sair
          </button>
          <div className="text-xs text-massa-400 dark:text-massa-500">
            Mão na Massa v0.1
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 overflow-auto relative pb-16 md:pb-0">
        {/* Botão hamburger no topo (mobile) */}
        <div className="md:hidden sticky top-0 z-20 bg-white/90 dark:bg-massa-50/90 backdrop-blur-sm border-b dark:border-massa-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-1 hover:bg-gray-100 dark:hover:bg-massa-200/20 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <CookingPot className="w-5 h-5 text-massa-500" />
            <span className="font-bold text-gray-800 dark:text-gray-100 text-sm" style={{ fontFamily: 'var(--font-serif)' }}>
              Mão na Massa
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* ─── Bottom Navigation (mobile) ─── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-massa-100 border-t dark:border-massa-200 flex items-center justify-around safe-area-bottom shadow-[0_-2px_12px_-6px_rgba(0,0,0,0.12)]">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[56px] min-h-[48px] justify-center transition-colors ${
                isActive
                  ? 'text-massa-600 dark:text-massa-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
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
