import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import PageTransition from './components/PageTransition'
import { Loading } from './components/AsyncWrapper'
import ProtectedRoute from './components/ProtectedRoute'

const Login = lazy(() => import('./pages/Login'))
const Landing = lazy(() => import('./pages/Landing'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Ingredientes = lazy(() => import('./pages/Ingredientes'))
const CalculadoraPreco = lazy(() => import('./pages/CalculadoraPreco'))
const ListaCompras = lazy(() => import('./pages/ListaCompras'))
const Produtos = lazy(() => import('./pages/Produtos'))
const Pedidos = lazy(() => import('./pages/Pedidos'))
const PedidoNovo = lazy(() => import('./pages/PedidoNovo'))
const PedidoDetalhe = lazy(() => import('./pages/PedidoDetalhe'))
const PublicTracking = lazy(() => import('./pages/PublicTracking'))
const Configuracao = lazy(() => import('./pages/admin/Configuracao'))
const Depoimentos = lazy(() => import('./pages/admin/Depoimentos'))

function PageFallback() {
  return <Loading height="h-64" message="Carregando página..." />
}

/** Wraps a lazy-loaded page with Suspense + ErrorBoundary + fade-in animation */
function Page({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        <PageTransition>
          {children}
        </PageTransition>
      </Suspense>
    </ErrorBoundary>
  )
}

function AdminPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>
        <Page>{children}</Page>
      </Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page (pública) */}
        <Route path="/" element={<Page><Landing /></Page>} />

        {/* Login page (pública) */}
        <Route path="/login" element={<Page><Login /></Page>} />

        {/* Public tracking (sem layout admin) */}
        <Route path="/track/:token" element={<Page><PublicTracking /></Page>} />

        {/* Admin — protegido por autenticação, com layout */}
        <Route path="/admin" element={<AdminPage><Dashboard /></AdminPage>} />
        <Route path="/admin/pedidos" element={<AdminPage><Pedidos /></AdminPage>} />
        <Route path="/admin/pedidos/novo" element={<AdminPage><PedidoNovo /></AdminPage>} />
        <Route path="/admin/pedidos/:id" element={<AdminPage><PedidoDetalhe /></AdminPage>} />
        <Route path="/admin/produtos" element={<AdminPage><Produtos /></AdminPage>} />
        <Route path="/admin/calculadora-preco" element={<AdminPage><CalculadoraPreco /></AdminPage>} />
        <Route path="/admin/lista-compras" element={<AdminPage><ListaCompras /></AdminPage>} />
        <Route path="/admin/ingredientes" element={<AdminPage><Ingredientes /></AdminPage>} />
        <Route path="/admin/configuracao" element={<AdminPage><Configuracao /></AdminPage>} />
        <Route path="/admin/depoimentos" element={<AdminPage><Depoimentos /></AdminPage>} />

        {/* Fallback: redireciona para home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
