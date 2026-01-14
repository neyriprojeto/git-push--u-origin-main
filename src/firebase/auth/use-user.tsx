'use client';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useAuth } from '..';

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setIsUserLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsUserLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  return { user, isUserLoading };
}
