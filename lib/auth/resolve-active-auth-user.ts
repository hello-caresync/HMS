import type { SupabaseClient, User } from '@supabase/supabase-js';

export type ActiveAuthResolution = {
  user: User | null;
  userId: string;
  source: 'getUser' | 'getSession' | 'fallback';
};

/**
 * Resolves the signed-in Supabase user for browser booking flows.
 * Tries getUser(), then getSession(), then an explicit fallback id from props/local session.
 */
export async function resolveActiveAuthUser(
  supabase: SupabaseClient,
  fallbackUserId?: string | null,
): Promise<ActiveAuthResolution | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (!userError && userData.user?.id) {
    return {
      user: userData.user,
      userId: userData.user.id,
      source: 'getUser',
    };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData.session?.user;
  if (sessionUser?.id) {
    return {
      user: sessionUser,
      userId: sessionUser.id,
      source: 'getSession',
    };
  }

  const fallback = String(fallbackUserId ?? '').trim();
  if (fallback) {
    return {
      user: null,
      userId: fallback,
      source: 'fallback',
    };
  }

  return null;
}
