import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Ingredientes from './pages/Ingredientes'
import ListaCompras from './pages/ListaCompras'
import Produtos from './pages/Produtos'
import Pedidos from './pages/Pedidos'
import PedidoNovo from './pages/PedidoNovo'
import PedidoDetalhe from './pages/PedidoDetalhe'
import PublicTracking from './pages/PublicTracking'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public tracking — no layout */}
        <Route path="/track/:token" element={<PublicTracking />} />

        {/* Admin — com layout */}
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/pedidos" element={<Layout><Pedidos /></Layout>} />
        <Route path="/pedidos/novo" element={<Layout><PedidoNovo /></Layout>} />
        <Route path="/pedidos/:id" element={<Layout><PedidoDetalhe /></Layout>} />
        <Route path="/produtos" element={<Layout><Produtos /></Layout>} />
        <Route path="/lista-compras" element={<Layout><ListaCompras /></Layout>} />
        <Route path="/ingredientes" element={<Layout><Ingredientes /></Layout>} />
      </Routes>
    </BrowserRouter>
  )
}
