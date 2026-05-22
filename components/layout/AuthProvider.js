'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import useUserStore from '@/store/userStore';

export default function AuthProvider({ children }) {
  const { setSession, clearSession } = useUserStore();

  useEffect(() => {
    // Generate starfield — runs only on client, no SSR mismatch
    const sf = document.getElementById('starfield');
    if (sf && sf.childNodes.length === 0) {
      for (let i = 0; i < 80; i++) {
        const s = document.createElement('div');
        s.className = 'star';
        s.style.left = Math.random() * 100 + '%';
        s.style.top = Math.random() * 100 + '%';
        s.style.setProperty('--duration', (2 + Math.random() * 4) + 's');
        s.style.animationDelay = (Math.random() * 4) + 's';
        s.style.width = (1 + Math.random() * 2) + 'px';
        s.style.height = s.style.width;
        sf.appendChild(s);
      }
    }

    // Auth session
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setSession(session);
      else clearSession();
    });

    return () => subscription.unsubscribe();
  }, [setSession, clearSession]);

  return <>{children}</>;
}