import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { readPublicSupabaseEnv } from '@/lib/supabase/env';

export type MiddlewareSupabase = {
  supabase: ReturnType<typeof createServerClient>;
  getUser: () => Promise<{ id: string } | null>;
  applyCookies: (response: NextResponse) => NextResponse;
};

/** Edge-safe Supabase client that refreshes auth cookies on the response. */
export function createMiddlewareSupabase(request: NextRequest): MiddlewareSupabase {
  const { url, anonKey } = readPublicSupabaseEnv();
  let response = NextResponse.next({ request });

  if (!url || !anonKey) {
    return {
      supabase: null as unknown as ReturnType<typeof createServerClient>,
      getUser: async () => null,
      applyCookies: (nextResponse: NextResponse) => nextResponse,
    };
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return {
    supabase,
    async getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user ? { id: user.id } : null;
    },
    applyCookies(nextResponse: NextResponse) {
      response.cookies.getAll().forEach(({ name, value }) => {
        nextResponse.cookies.set(name, value);
      });
      return nextResponse;
    },
  };
}
