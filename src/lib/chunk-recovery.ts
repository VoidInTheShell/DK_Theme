const reloadKey = 'dk-theme:chunk-reload-at'
const reloadWindowMs = 10_000

function canRetry() {
  try {
    const lastReload = Number(sessionStorage.getItem(reloadKey))
    return !Number.isFinite(lastReload) || Date.now() - lastReload >= reloadWindowMs
  } catch {
    return false
  }
}

/** Reload once after a deploy leaves a tab with an outdated lazy route chunk. */
export function recoverFromChunkFailure() {
  if (!canRetry()) return

  try {
    sessionStorage.setItem(reloadKey, String(Date.now()))
  } catch {
    return
  }

  window.location.reload()
}

export function isChunkLoadError(error: unknown) {
  if (!(error instanceof Error)) return false
  return /(?:dynamically imported module|importing a module script failed|failed to fetch dynamically imported module|unable to preload|loading chunk .* failed)/i.test(error.message)
}
