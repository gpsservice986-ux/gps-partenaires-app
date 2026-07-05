import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yazblopcntxftznyyssq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhemJsb3BjbnR4ZnR6bnl5c3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTM5MDUsImV4cCI6MjA5ODQyOTkwNX0.DZyhX4b9VPC_KVGFvcPUV8HvaMKidLUzS1GG1G7dAKw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);