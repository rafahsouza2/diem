import { createBrowserClient } from '@supabase/ssr'

function debugFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (init?.headers) {
    const h = init.headers as Record<string, string>
    for (const [k, v] of Object.entries(h)) {
      for (let i = 0; i < v.length; i++) {
        if (v.charCodeAt(i) > 255) {
          console.error(`BAD HEADER "${k}" pos=${i} code=${v.charCodeAt(i)} char="${v[i]}"`)
          console.error(`Full value: ${v}`)
        }
      }
    }
  }
  return fetch(input, init)
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { fetch: debugFetch } }
  )
}
