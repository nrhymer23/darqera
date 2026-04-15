import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service role key.
 * This bypasses RLS and should ONLY be used in API routes / server actions.
 * Never import this in client components or expose the key to the browser.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;
