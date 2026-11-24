import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Returns true if Supabase URL and key are configured in environment variables.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && (supabaseAnonKey || supabaseServiceRoleKey));
}

let _supabaseClient: SupabaseClient | null = null;
let _supabaseAdminClient: SupabaseClient | null = null;

/**
 * Public client for client-side and public authenticated calls
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!_supabaseClient) {
    _supabaseClient = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceRoleKey, {
      auth: {
        persistSession: typeof window !== "undefined",
        autoRefreshToken: true,
      },
    });
  }
  return _supabaseClient;
}

/**
 * Admin client with Service Role privileges (server-side only)
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  const serviceKey = supabaseServiceRoleKey || supabaseAnonKey;
  if (!supabaseUrl || !serviceKey) {
    return null;
  }
  if (!_supabaseAdminClient) {
    _supabaseAdminClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabaseAdminClient;
}

/**
 * Helper to upload a file to a Supabase bucket
 */
export async function uploadToStorage(
  bucket: "public-files" | "visitor-captures" | "apps-files" | "vault-assets" | "documents",
  path: string,
  fileBody: Buffer | Blob | File,
  contentType?: string
): Promise<{ url: string | null; error: Error | null }> {
  const client = getSupabaseAdminClient() || getSupabaseClient();
  if (!client) {
    return { url: null, error: new Error("Supabase is not configured.") };
  }

  const { data, error } = await client.storage
    .from(bucket)
    .upload(path, fileBody, {
      upsert: true,
      contentType,
    });

  if (error) {
    return { url: null, error };
  }

  const { data: publicUrlData } = client.storage.from(bucket).getPublicUrl(data.path);
  return { url: publicUrlData.publicUrl, error: null };
}

/**
 * Helper to increment app download counter
 */
export async function incrementAppDownloadCount(appId: string): Promise<boolean> {
  const client = getSupabaseAdminClient() || getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.rpc("increment_app_download", { app_id: appId });
    return !error;
  } catch {
    return false;
  }
}
