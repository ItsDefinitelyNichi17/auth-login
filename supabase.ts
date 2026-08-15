import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)

if(!supabase) {
  throw new Error('Failed to create Supabase client')
}

export { supabase }
