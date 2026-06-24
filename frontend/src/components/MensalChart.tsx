import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { MesItem } from '../api/client'

const formatBRL = (v: number) => `R$ ${v.toFixed(2)}`
const formatMes = (m: string) => {
  const [ano, mes] = m.split('-')
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${meses[parseInt(mes) - 1]}/${ano}`
}

export default function MensalChart({ data }: { data: MesItem[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Nenhum dado disponível para o período
      </div>
    )
  }

  const chartData = data.map(m => ({
    ...m,
    mes: formatMes(m.mes),
  }))

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0e8e0" />
          <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#8a7a6a' }} />
          <YAxis tick={{ fontSize: 12, fill: '#8a7a6a' }} tickFormatter={v => `R$${v}`} />
          <Tooltip
            formatter={(value) => [formatBRL(Number(value)), '']}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #e5d9d0',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            }}
          />
          <Legend />
          <Bar dataKey="faturamento" name="Faturamento" fill="#C73E1D" radius={[4, 4, 0, 0]} />
          <Bar dataKey="custos" name="Custos" fill="#E87A58" radius={[4, 4, 0, 0]} />
          <Bar dataKey="lucro" name="Lucro" fill="#22c55e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
