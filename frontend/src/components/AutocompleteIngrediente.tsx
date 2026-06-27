import AutocompleteInput from './AutocompleteInput'
import { ingredientesApi, type Ingrediente } from '../api/client'
import { listarIngredientesOffline } from '../services/offlineClient'

interface Props {
  /** Called when user selects an ingredient */
  onSelect: (ingrediente: Ingrediente) => void
  /** Controlled value */
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
  error?: string
  placeholder?: string
}

export default function AutocompleteIngrediente({
  onSelect,
  value,
  onChange,
  disabled,
  autoFocus,
  error,
  placeholder = 'Buscar ingrediente...',
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
        // Tenta buscar na API com search param
        try {
          const data = await ingredientesApi.listar(query, 10)
          return data
            .filter(i => i.ativo)
            .map(i => ({
              id: i.id,
              label: i.nome,
              sublabel: `${i.quantidade_estoque} ${i.unidade_medida} | R$ ${(i.preco_atual / i.embalagem).toFixed(4)}/${i.unidade_medida}`,
            }))
        } catch {
          // Fallback para offline
          const data = await listarIngredientesOffline()
          return data
            .filter(i => i.ativo && i.nome.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 10)
            .map(i => ({
              id: i.id,
              label: i.nome,
              sublabel: `${i.quantidade_estoque} ${i.unidade_medida}`,
            }))
        }
      }}
      onSelect={item => {
        // Busca o ingrediente completo via API
        ingredientesApi.listar(item.label, 1).then(data => {
          const ing = data.find(i => i.id === item.id)
          if (ing) onSelect(ing)
        }).catch(() => {
          listarIngredientesOffline().then(data => {
            const ing = data.find(i => i.id === item.id)
            if (ing) onSelect(ing)
          })
        })
      }}
    />
  )
}
