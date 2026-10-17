'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { SessionUser } from '@/types';
import { getAuthInstance, getDb } from '@/lib/firebase';

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuthInstance();
    let unsubDoc: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }

      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
          email: firebaseUser.email || '',
        });
        setLoading(false);

        try {
          const db = getDb();
          unsubDoc = onSnapshot(
            doc(db, 'users', firebaseUser.uid),
            (snap) => {
              if (snap.exists()) {
                const data = snap.data();
                if (data.displayName) {
                  setUser((prev) =>
                    prev ? { ...prev, displayName: data.displayName } : null
                  );
                }
              }
            },
            () => {
              // Ignore snapshot error on sign-out
            }
          );
        } catch {
          // ignore if firestore not yet ready
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    const handleCustomUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<SessionUser>;
      if (customEvent.detail) {
        setUser(customEvent.detail);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('taskflow:user-updated', handleCustomUpdate);
    }

    return () => {
      if (unsubDoc) {
        unsubDoc();
      }
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('taskflow:user-updated', handleCustomUpdate);
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
