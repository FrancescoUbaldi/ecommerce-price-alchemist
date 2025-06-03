
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nwukchugdhapggvjkgnb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53dWtjaHVnZGhhcGdndmprZ25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5Nzc2MDEsImV4cCI6MjA2NDU1MzYwMX0.3Bm6bXboicZblMvxRCe2CIScYrDPD4-AltRdzukmpI4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
