export async function getJson(url: string) {
  const res = await fetch(url)
  if (!res.ok) return null
  return res.json()
}

export async function putJson(url: string, data: any) {
  await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data ?? null)
  })
}
