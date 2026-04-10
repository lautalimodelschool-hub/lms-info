import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase URL or Anon Key is missing. Please configure them in the Settings menu.");
      // Return a dummy client or throw a clear error when used
      // For now, we'll try to create it and let it fail if absolutely necessary, 
      // but the goal is to avoid the top-level crash.
      return createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder");
    }
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
};

// Export a proxy or just the getter
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const instance = getSupabase();
    return (instance as any)[prop];
  }
});
