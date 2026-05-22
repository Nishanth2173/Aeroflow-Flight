'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useAuth() {
  const [user, setUser] = useState(undefined); // undefined = still loading

  useEffect(() => {
    const supabase = createClient();

    // Get current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading: user === undefined };
}