import AutocompleteInput from './AutocompleteInput'
import { produtosApi, type Produto } from '../api/client'
import { listarProdutosOffline } from '../services/offlineClient'

interface Props {
  /** Called when user selects a product */
  onSelect: (produto: Produto) => void
  /** Controlled value */
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
  error?: string
  placeholder?: string
}

export default function AutocompleteProduto({
  onSelect,
  value,
  onChange,
  disabled,
  autoFocus,
  error,
  placeholder = 'Buscar produto...',
}: Props) {
  return (
    <AutocompleteInput
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      autoFocus={autoFocus}
      error={error}
      onSearch={async (query: string) => {
        try {
          const data = await produtosApi.listar(query, 10)
          return data
            .filter(p => p.ativo)
            .map(p => ({
              id: p.id,
              label: p.nome,
              sublabel: p.variacoes?.length
                ? `${p.variacoes.length} variações`
                : p.descricao ?? '',
            }))
        } catch {
          const data = await listarProdutosOffline()
          return data
            .filter(p => p.ativo && p.nome.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 10)
            .map(p => ({
              id: p.id,
              label: p.nome,
              sublabel: p.variacoes?.length
                ? `${p.variacoes.length} variações`
                : p.descricao ?? '',
            }))
        }
      }}
      onSelect={item => {
        // Fetch the full product with variations
        produtosApi.listar(item.label, 1).then(data => {
          const prod = data.find(p => p.id === item.id)
          if (prod) onSelect(prod)
        }).catch(() => {
          listarProdutosOffline().then(data => {
            const prod = data.find(p => p.id === item.id)
            if (prod) onSelect(prod)
          })
        })
      }}
    />
  )
}
