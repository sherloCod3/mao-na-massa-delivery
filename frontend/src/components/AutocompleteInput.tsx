import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import { Search, X } from 'lucide-react'

interface AutocompleteItem {
  id: number
  label: string
  sublabel?: string
}

interface Props {
  /** Placeholder text */
  placeholder?: string
  /** Async fetcher: returns items based on search query */
  onSearch: (query: string) => Promise<AutocompleteItem[]>
  /** Called when user selects an item */
  onSelect: (item: AutocompleteItem) => void
  /** External value to display (for controlled mode) */
  value?: string
  /** Called when external value changes */
  onChange?: (value: string) => void
  /** Debounce delay in ms */
  debounceMs?: number
  /** Min chars before searching */
  minChars?: number
  /** Disabled state */
  disabled?: boolean
  autoFocus?: boolean
  /** Optional error message */
  error?: string
}

export default function AutocompleteInput({
  placeholder = 'Pesquisar...',
  onSearch,
  onSelect,
  value = '',
  onChange,
  debounceMs = 300,
  minChars = 2,
  disabled = false,
  autoFocus = false,
  error,
}: Props) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<AutocompleteItem[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [searched, setSearched] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const doSearch = useCallback(async (q: string) => {
    if (q.length < minChars) {
      setResults([])
      setOpen(false)
      setSearched(false)
      return
    }
    setLoading(true)
    setSearched(false)
    try {
      const items = await onSearch(q)
      setResults(items)
      setOpen(items.length > 0 || q.length >= minChars)
      setSearched(true)
      setActiveIdx(-1)
    } catch {
      setResults([])
      setOpen(false)
      setSearched(false)
    } finally {
      setLoading(false)
    }
  }, [onSearch, minChars])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(query), debounceMs)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, debounceMs, doSearch])

  const selectItem = (item: AutocompleteItem) => {
    setQuery(item.label)
    setOpen(false)
    onSelect(item)
    onChange?.(item.label)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(prev => (prev < results.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(prev => (prev > 0 ? prev - 1 : results.length - 1))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      selectItem(results[activeIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIdx(-1)
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const el = listRef.current.children[activeIdx] as HTMLElement
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIdx])

  const clear = () => {
    setQuery('')
    setResults([])
    setOpen(false)
    onChange?.('')
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); onChange?.(e.target.value) }}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`w-full pl-9 pr-8 py-2 border rounded-lg text-sm outline-none transition-colors
            ${error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
              : 'border-gray-300 focus:ring-2 focus:ring-massa-500/20 focus:border-massa-500'}
            disabled:opacity-50 disabled:bg-gray-50`}
        />
        {query && (
          <button
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {/* Loading indicator */}
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <span className="w-4 h-4 border-2 border-gray-200 border-t-massa-600 rounded-full animate-spin inline-block" />
        </div>
      )}

      {/* Dropdown */}
      {open && results.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
        >
          {results.map((item, idx) => (
            <li
              key={item.id}
              onMouseDown={() => selectItem(item)}
              onMouseEnter={() => setActiveIdx(idx)}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between
                ${idx === activeIdx ? 'bg-massa-50 text-massa-900' : 'text-gray-700 hover:bg-gray-50'}
                ${idx < results.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <span className="font-medium">{item.label}</span>
              {item.sublabel && (
                <span className="text-xs text-gray-400 ml-2 shrink-0">{item.sublabel}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {searched && results.length === 0 && !loading && query.length >= minChars && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-sm text-gray-400">
          Nenhum resultado encontrado
        </div>
      )}
    </div>
  )
}
