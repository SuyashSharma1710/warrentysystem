import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dkytjcftwdvwpixtuivp.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_-T6iAZI6bhq6Ehh3R6VHmg_z2XyD_l3'
  )
}
