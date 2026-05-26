export function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function withIds(items: any[]) {
  return (Array.isArray(items) ? items : []).map((x) => ({ id: x?.id ?? makeId(), ...x }))
}

export function scheduleSave(key: string, fn: () => Promise<void>) {
  const w: any = window as any
  if (!w.__carSaveTimers) w.__carSaveTimers = {}
  if (w.__carSaveTimers[key]) clearTimeout(w.__carSaveTimers[key])
  w.__carSaveTimers[key] = setTimeout(() => {
    fn().catch(() => {})
  }, 400)
}

export function formatDateYMD(v: any) {
  const s = String(v ?? '').trim()
  if (!s) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const d = new Date(s)
  if (!Number.isFinite(d.getTime())) return s
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function normalizeTags(tags: any) {
  const raw = Array.isArray(tags) ? tags : tags == null ? [] : [tags]
  const cleaned = raw.map((x: any) => String(x ?? '').trim()).filter(Boolean)
  return Array.from(new Set(cleaned))
}
