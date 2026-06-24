import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import { Loading } from './components/AsyncWrapper'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Ingredientes = lazy(() => import('./pages/Ingredientes'))
const ListaCompras = lazy(() => import('./pages/ListaCompras'))
const Produtos = lazy(() => import('./pages/Produtos'))
const Pedidos = lazy(() => import('./pages/Pedidos'))
const PedidoNovo = lazy(() => import('./pages/PedidoNovo'))
const PedidoDetalhe = lazy(() => import('./pages/PedidoDetalhe'))
const PublicTracking = lazy(() => import('./pages/PublicTracking'))

function PageFallback() {
  return <Loading height="h-64" message="Carregando página..." />
}

/** Wraps a lazy-loaded page with Suspense + ErrorBoundary */
function Page({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public tracking — no layout */}
        <Route path="/track/:token" element={
          <Page><PublicTracking /></Page>
        } />

        {/* Admin — com layout */}
        <Route path="/" element={<Layout><Page><Dashboard /></Page></Layout>} />
        <Route path="/pedidos" element={<Layout><Page><Pedidos /></Page></Layout>} />
        <Route path="/pedidos/novo" element={<Layout><Page><PedidoNovo /></Page></Layout>} />
        <Route path="/pedidos/:id" element={<Layout><Page><PedidoDetalhe /></Page></Layout>} />
        <Route path="/produtos" element={<Layout><Page><Produtos /></Page></Layout>} />
        <Route path="/lista-compras" element={<Layout><Page><ListaCompras /></Page></Layout>} />
        <Route path="/ingredientes" element={<Layout><Page><Ingredientes /></Page></Layout>} />
      </Routes>
    </BrowserRouter>
  )
}
