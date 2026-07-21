/**
 * Next.js App Router adapter — optional import from API routes / Server Actions only.
 * Keeps @supabase/ssr out of the core service graph.
 */
export async function createNextServerSupabaseClient(): Promise<
  import('@supabase/supabase-js').SupabaseClient
> {
  const { createServerClient } = await import('@supabase/ssr');
  const { cookies } = await import('next/headers');

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* Server Component read-only cookie context */
          }
        },
      },
    },
  );
}
