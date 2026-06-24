import { db, invalidateAllCache, type QueuedMutation } from './db'

// ── Custom error for queued operations ────────────────────────────

export class MutationQueuedError extends Error {
  constructor(message = 'Salvo offline — será sincronizado automaticamente') {
    super(message)
    this.name = 'MutationQueuedError'
  }
}

// ── Event emitter for sync state ──────────────────────────────────

type SyncListener = (pending: number) => void

const syncListeners = new Set<SyncListener>()

export function onPendingChange(fn: SyncListener) {
  syncListeners.add(fn)
  return () => syncListeners.delete(fn)
}

function notifyListeners() {
  db.filaMutacoes.count().then(count => {
    syncListeners.forEach(fn => fn(count))
  })
}

// ── Queue a mutation ──────────────────────────────────────────────

export async function enfileirarMutacao(op: Omit<QueuedMutation, 'id' | 'createdAt' | 'retryCount'>) {
  await db.filaMutacoes.add({
    ...op,
    createdAt: Date.now(),
    retryCount: 0,
  })
  notifyListeners()
}

// ── Process the entire queue ──────────────────────────────────────

interface ProcessResult {
  synced: number
  failed: number
}

export async function processarFilaMutacoes(): Promise<ProcessResult> {
  const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1'
  const mutations = await db.filaMutacoes.orderBy('createdAt').toArray()
  let synced = 0
  let failed = 0

  const MAX_RETRIES = 5

  for (const m of mutations) {
    if (m.retryCount >= MAX_RETRIES) {
      // Abandon after max retries — remove from queue and move on
      await db.filaMutacoes.delete(m.id!)
      failed++
      continue
    }

    try {
      const res = await fetch(`${API_BASE}${m.endpoint}`, {
        method: m.method,
        headers: { 'Content-Type': 'application/json' },
        body: m.body ? JSON.stringify(m.body) : undefined,
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      await db.filaMutacoes.delete(m.id!)
      synced++
    } catch (err) {
      failed++
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido'
      await db.filaMutacoes.update(m.id!, {
        retryCount: m.retryCount + 1,
        lastError: errorMsg,
      })
      // Stop processing on first failure to preserve order
      break
    }
  }

  // If all succeeded, invalidate caches to refresh data
  if (failed === 0 && synced > 0) {
    await invalidateAllCache()
  }

  notifyListeners()
  return { synced, failed }
}

// ── Get pending count ─────────────────────────────────────────────

export async function obterFilaPendente(): Promise<number> {
  return db.filaMutacoes.count()
}

// ── Register Background Sync ──────────────────────────────────────

async function registrarBackgroundSync() {
  try {
    const reg = await navigator.serviceWorker.ready
    await (reg as any).sync.register('sync-mutations')
  } catch {
    // Background Sync not supported — online event will handle it
  }
}

// ── Initialize auto-sync ──────────────────────────────────────────

let initialized = false

export function inicializarSincronizacao() {
  if (initialized) return
  initialized = true

  // Process queue when coming back online
  window.addEventListener('online', async () => {
    const pending = await obterFilaPendente()
    if (pending > 0) {
      await processarFilaMutacoes()
    }
  })

  // Listen for messages from the Service Worker (Background Sync)
  navigator.serviceWorker?.addEventListener('message', async (event) => {
    if (event.data?.type === 'PROCESS_MUTATIONS') {
      await processarFilaMutacoes()
    }
  })

  // Try to register Background Sync on first load (if there are pending items)
  registrarBackgroundSync()

  // Also try immediately if there are pending items
  obterFilaPendente().then(count => {
    if (count > 0 && navigator.onLine) {
      processarFilaMutacoes()
    }
  })

  notifyListeners()
}

// ── Manual sync trigger ───────────────────────────────────────────

export async function sincronizarAgora(): Promise<ProcessResult> {
  if (!navigator.onLine) {
    return { synced: 0, failed: 0 }
  }
  const result = await processarFilaMutacoes()
  // Re-register Background Sync for any remaining items
  await registrarBackgroundSync()
  return result
}
