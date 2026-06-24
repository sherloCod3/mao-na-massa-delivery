import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { Clock } from 'lucide-react'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Ingredientes = lazy(() => import('./pages/Ingredientes'))
const ListaCompras = lazy(() => import('./pages/ListaCompras'))
const Produtos = lazy(() => import('./pages/Produtos'))
const Pedidos = lazy(() => import('./pages/Pedidos'))
const PedidoNovo = lazy(() => import('./pages/PedidoNovo'))
const PedidoDetalhe = lazy(() => import('./pages/PedidoDetalhe'))
const PublicTracking = lazy(() => import('./pages/PublicTracking'))

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <Clock className="w-8 h-8 text-massa-300 animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public tracking — no layout */}
        <Route path="/track/:token" element={
          <Suspense fallback={<PageFallback />}><PublicTracking /></Suspense>
        } />

        {/* Admin — com layout */}
        <Route path="/" element={<Layout><Suspense fallback={<PageFallback />}><Dashboard /></Suspense></Layout>} />
        <Route path="/pedidos" element={<Layout><Suspense fallback={<PageFallback />}><Pedidos /></Suspense></Layout>} />
        <Route path="/pedidos/novo" element={<Layout><Suspense fallback={<PageFallback />}><PedidoNovo /></Suspense></Layout>} />
        <Route path="/pedidos/:id" element={<Layout><Suspense fallback={<PageFallback />}><PedidoDetalhe /></Suspense></Layout>} />
        <Route path="/produtos" element={<Layout><Suspense fallback={<PageFallback />}><Produtos /></Suspense></Layout>} />
        <Route path="/lista-compras" element={<Layout><Suspense fallback={<PageFallback />}><ListaCompras /></Suspense></Layout>} />
        <Route path="/ingredientes" element={<Layout><Suspense fallback={<PageFallback />}><Ingredientes /></Suspense></Layout>} />
      </Routes>
    </BrowserRouter>
  )
}
