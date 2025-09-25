
import { createClient } from '@supabase/supabase-js';

// FIX: Cast `import.meta` to `any` to access Vite environment variables and resolve TypeScript error.
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
// FIX: Cast `import.meta` to `any` to access Vite environment variables and resolve TypeScript error.
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

